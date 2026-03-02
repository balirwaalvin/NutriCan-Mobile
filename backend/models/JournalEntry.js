const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weight: { type: Number, required: true },
    energy: { type: Number, required: true, min: 1, max: 10 },
    bp: { type: Number }, // systolic, optional
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Compound index: fast lookups for a user's entries in date order
journalEntrySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
