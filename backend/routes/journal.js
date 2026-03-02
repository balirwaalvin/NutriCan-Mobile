const router = require('express').Router();
const JournalEntry = require('../models/JournalEntry');
const { requireAuth } = require('../middleware/auth');

// ─── GET /api/journal ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const entries = await JournalEntry.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const result = entries.map((e) => ({
      id: e._id.toString(),
      timestamp: e.createdAt.toISOString(),
      name: new Date(e.createdAt).toLocaleDateString(undefined, { weekday: 'short' }),
      weight: e.weight,
      energy: e.energy,
      bp: e.bp,
      notes: e.notes,
    }));

    res.json({ entries: result });
  } catch (err) {
    console.error('Get journal error:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch journal entries.' });
  }
});

// ─── POST /api/journal ────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { weight, energy, bp, notes } = req.body;

    if (weight === undefined || energy === undefined) {
      return res.status(400).json({ message: 'weight and energy are required.' });
    }

    const entry = await JournalEntry.create({
      userId: req.user._id,
      weight,
      energy,
      ...(bp !== undefined && !isNaN(bp) ? { bp } : {}),
      ...(notes && notes.trim() ? { notes: notes.trim() } : {}),
    });

    res.status(201).json({ id: entry._id.toString() });
  } catch (err) {
    console.error('Add journal error:', err);
    res.status(500).json({ message: err.message || 'Failed to add journal entry.' });
  }
});

module.exports = router;
