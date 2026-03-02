'use strict';

/**
 * Seed script – populates the database with one demo user + sample data.
 *
 * Usage:
 *   node db/seed.js          ← uses MONGODB_URI from backend/.env
 *
 * WARNING: This will CLEAR all existing data in the nutrican database first.
 *          Only run it in development.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const JournalEntry = require('../models/JournalEntry');
const Meal = require('../models/Meal');

// ── Sample data ───────────────────────────────────────────────────────────────

const DEMO_EMAIL = 'demo@nutrican.app';
const DEMO_PASSWORD = 'password123';

const sampleJournalEntries = [
  { weight: 58.0, energy: 6, bp: 118, notes: 'Feeling okay today.' },
  { weight: 57.8, energy: 7, bp: 120 },
  { weight: 58.2, energy: 5, bp: 122, notes: 'A bit tired after treatment.' },
  { weight: 57.5, energy: 8, bp: 115, notes: 'Good day!' },
  { weight: 57.9, energy: 6 },
  { weight: 58.1, energy: 7, bp: 119 },
  { weight: 57.7, energy: 9, notes: 'Energy is improving.' },
];

const sampleMeals = [
  { name: 'Oatmeal with banana', nutrients: { calories: 320, sugar: 14, salt: 0.2 } },
  { name: 'Grilled chicken & brown rice', nutrients: { calories: 520, sugar: 2, salt: 1.1 } },
  { name: 'Vegetable soup', nutrients: { calories: 180, sugar: 6, salt: 1.4 } },
  { name: 'Avocado toast', nutrients: { calories: 290, sugar: 3, salt: 0.8 } },
  { name: 'Smoothie – spinach & mango', nutrients: { calories: 210, sugar: 22, salt: 0.1 } },
];

// ── Run ───────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log('✅ Connected to:', mongoose.connection.host);

  if (process.env.NODE_ENV === 'production') {
    console.error('⛔  Refusing to seed a production database. Aborting.');
    process.exit(1);
  }

  // Clear collections
  console.log('🗑️  Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    JournalEntry.deleteMany({}),
    Meal.deleteMany({}),
  ]);

  // Create demo user
  console.log('👤 Creating demo user…');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await User.create({
    name: 'Demo User',
    email: DEMO_EMAIL,
    passwordHash,
    age: 35,
    height: 162,
    weight: 58,
    cancerType: 'Cervical',
    cancerStage: 'Early Stage (I-II)',
    otherConditions: ['Hypertension (Stage 1)'],
    treatmentStages: ['Chemotherapy'],
    plan: 'Free',
    isVerified: false,
    documentsSubmitted: false,
  });
  console.log(`   ✅ User created: ${user.email}  (id: ${user._id})`);

  // Create journal entries spread over the past 7 days
  console.log('📓 Seeding journal entries…');
  const journalDocs = sampleJournalEntries.map((entry, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (sampleJournalEntries.length - 1 - i));
    return { ...entry, userId: user._id, createdAt: date, updatedAt: date };
  });
  await JournalEntry.insertMany(journalDocs);
  console.log(`   ✅ ${journalDocs.length} journal entries created`);

  // Create meal logs spread over the past 5 days
  console.log('🍽️  Seeding meal logs…');
  const mealDocs = sampleMeals.map((meal, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (sampleMeals.length - 1 - i));
    return { ...meal, userId: user._id, createdAt: date, updatedAt: date };
  });
  await Meal.insertMany(mealDocs);
  console.log(`   ✅ ${mealDocs.length} meal logs created`);

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────');
  console.log(`  Email    : ${DEMO_EMAIL}`);
  console.log(`  Password : ${DEMO_PASSWORD}`);
  console.log('─────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
