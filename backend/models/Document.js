const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    fileType: { type: String },
    spacesKey: { type: String, required: true }, // object key inside the DO Space
    spacesUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending_verification', 'verified', 'rejected'],
      default: 'pending_verification',
    },
  },
  { timestamps: true }
);

// Compound index: latest documents for a user first
documentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
