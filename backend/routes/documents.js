const router = require('express').Router();
const multer = require('multer');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Document = require('../models/Document');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// ── DigitalOcean Spaces S3 client ─────────────────────────────────────────────
const s3 = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
  forcePathStyle: false,
});

// Use memory storage so we can pipe the buffer directly to Spaces
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF documents are allowed.'));
    }
    cb(null, true);
  },
});

// ─── POST /api/documents/upload ───────────────────────────────────────────────
router.post('/upload', requireAuth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided.' });
    }

    const key = `users/${req.user._id}/documents/${Date.now()}-${req.file.originalname}`;
    const bucket = process.env.DO_SPACES_BUCKET;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'private', // Keep medical docs private
      })
    );

    const publicUrl = `${process.env.DO_SPACES_ENDPOINT}/${bucket}/${key}`;

    // Save document record to MongoDB
    await Document.create({
      userId: req.user._id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      spacesKey: key,
      spacesUrl: publicUrl,
      status: 'pending_verification',
    });

    // Mark profile as submitted and auto-verify for demo
    await User.findByIdAndUpdate(req.user._id, {
      $set: { documentsSubmitted: true, isVerified: true },
    });

    res.json({ message: 'Document uploaded successfully.', key });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ message: err.message || 'Upload failed.' });
  }
});

// ─── GET /api/documents/book-signed-url ──────────────────────────────────────
// Returns a signed URL for a specific book key (e.g., books/heal-well-guide.pdf)
router.get('/book-signed-url', requireAuth, async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) {
      return res.status(400).json({ message: 'Missing key parameter' });
    }

    // Security check: strictly allow only access to "books/" prefix to prevent arbitrary file access
    if (!key.startsWith('books/')) {
      return res.status(403).json({ message: 'Access denied. Only books allowed.' });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET || 'nutrican-store', // Fallback if env not set
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour link
    res.json({ url });
  } catch (err) {
    console.error('Book signed URL error:', err);
    res.status(500).json({ message: 'Failed to generate book link.' });
  }
});

// ─── GET /api/documents ───────────────────────────────────────────────────────
// Returns a list of the user's documents with short-lived signed URLs for download
router.get('/', requireAuth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Generate a 15-minute signed URL for each document
    const result = await Promise.all(
      docs.map(async (d) => {
        const signedUrl = await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: d.spacesKey,
          }),
          { expiresIn: 900 } // seconds
        );
        return { ...d, downloadUrl: signedUrl };
      })
    );

    res.json({ documents: result });
  } catch (err) {
    console.error('Get documents error:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch documents.' });
  }
});

module.exports = router;
