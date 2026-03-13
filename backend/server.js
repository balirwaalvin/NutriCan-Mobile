require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const { connectDB, disconnect, healthCheck } = require('./db/connection');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const journalRoutes = require('./routes/journal');
const mealsRoutes = require('./routes/meals');
const documentsRoutes = require('./routes/documents');
const aiRoutes = require('./routes/ai');
const chatRoutes = require('./routes/chat');
const { requireAuth } = require('./middleware/auth');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // In development, allow any localhost port automatically
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin "${origin}" is not allowed.`));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', db: healthCheck() }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', requireAuth, chatRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error.' });
});

// ── Connect DB then start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

// Start HTTP server first so health checks always pass, then connect to DB.
const server = app.listen(PORT, () => {
  console.log(`🚀 NutriCan API running on http://localhost:${PORT}`);
  // Connect after the server is already accepting requests.
  // Do NOT exit on failure – Mongoose will keep retrying and the health
  // check endpoint must stay reachable for DigitalOcean App Platform.
  connectDB(process.env.MONGODB_URI).catch((err) => {
    console.error('❌ MongoDB connection failed (will retry):', err.message);
    console.error('   Make sure MONGODB_URI is set in the environment.');
  });
});

// ── Socket.IO Setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: corsOptions
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { sub: userId }
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`💬 User connected to chat: ${socket.id}`);

  socket.on('sendMessage', async (data) => {
    try {
      const newMessage = new Message({
        text: data.text,
        senderName: data.senderName,
        senderId: data.senderId,
        replyTo: data.replyTo || null,
      });
      await newMessage.save();

      const populatedMessage = await Message.findById(newMessage._id).populate('replyTo', 'text senderName').exec();
      io.emit('receiveMessage', populatedMessage);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('likeMessage', async (data) => {
    try {
      const message = await Message.findById(data.messageId);
      if (!message) return;

      const userIndex = message.likes.indexOf(data.userId);
      if (userIndex === -1) {
        message.likes.push(data.userId);
      } else {
        message.likes.splice(userIndex, 1);
      }
      await message.save();

      io.emit('messageLiked', { messageId: message._id, likes: message.likes });
    } catch (error) {
      console.error('Error liking message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`💬 User disconnected: ${socket.id}`);
  });
});

// ── Graceful shutdown ──────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n${signal} received – shutting down gracefully…`);
  server.close(async () => {
    await disconnect();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
