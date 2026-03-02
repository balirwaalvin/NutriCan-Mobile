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

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
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
  })
);

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
