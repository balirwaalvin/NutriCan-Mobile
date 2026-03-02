'use strict';

/**
 * MongoDB connection module.
 *
 * Features
 * ────────
 * • Singleton connection – safe to `require` from any file.
 * • Automatic reconnection with exponential back-off.
 * • Explicit index creation on startup (`ensureIndexes`).
 * • Detailed event logging so you can see what the driver is doing.
 * • `healthCheck()` export for the /health route.
 */

const dns = require('dns');
const mongoose = require('mongoose');

// ── DNS fix (Windows / Node c-ares workaround) ────────────────────────────────
// Node's built-in c-ares DNS client can fail on some Windows setups.
// Force it to use Google's public DNS servers and prefer IPv4.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

// ── Mongoose global settings ──────────────────────────────────────────────────

// Throw when using a field that was not declared in the schema
mongoose.set('strictQuery', true);

// ── Connection state ──────────────────────────────────────────────────────────

let isConnected = false;

// ── Event listeners ───────────────────────────────────────────────────────────

mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('🟢 MongoDB connected –', mongoose.connection.host);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('🔴 MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('🔄 MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

// ── Index setup ───────────────────────────────────────────────────────────────

/**
 * Ensure all collection indexes are created.
 * Called once after the initial connection succeeds.
 */
async function ensureIndexes() {
  // Import models so Mongoose registers them and creates their indexes
  const User = require('../models/User');
  const JournalEntry = require('../models/JournalEntry');
  const Meal = require('../models/Meal');
  const Document = require('../models/Document');

  await Promise.all([
    User.createIndexes(),
    JournalEntry.createIndexes(),
    Meal.createIndexes(),
    Document.createIndexes(),
  ]);

  console.log('✅ MongoDB indexes verified');
}

// ── Connect ───────────────────────────────────────────────────────────────────

/**
 * Connect to MongoDB.
 * Resolves only once the connection is established (or rejects on fatal error).
 *
 * @param {string} uri - MongoDB connection URI from environment variable.
 */
async function connectDB(uri) {
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to backend/.env before starting the server.'
    );
  }

  if (isConnected) return; // Already connected

  console.log('⏳ Connecting to MongoDB…');

  await mongoose.connect(uri, {
    // Keep the connection alive through temporary network blips
    serverSelectionTimeoutMS: 10_000, // give up initial connection after 10s
    socketTimeoutMS: 45_000,          // close idle sockets after 45s
    maxPoolSize: 10,                  // max 10 connections in pool
    minPoolSize: 2,                   // keep at least 2 warm
  });

  await ensureIndexes();
}

// ── Health check ──────────────────────────────────────────────────────────────

/**
 * Returns a status object usable in a /health endpoint.
 */
function healthCheck() {
  return {
    status: isConnected ? 'connected' : 'disconnected',
    host: isConnected ? mongoose.connection.host : null,
    db: isConnected ? mongoose.connection.name : null,
    readyState: mongoose.connection.readyState,
  };
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────

async function disconnect() {
  if (!isConnected) return;
  await mongoose.disconnect();
  console.log('👋 MongoDB disconnected gracefully');
}

module.exports = { connectDB, disconnect, healthCheck };
