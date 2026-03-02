const router = require('express').Router();
const Meal = require('../models/Meal');
const { requireAuth } = require('../middleware/auth');

// ─── GET /api/meals ───────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const meals = await Meal.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const result = meals.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      nutrients: m.nutrients,
      timestamp: m.createdAt.toISOString(),
    }));

    res.json({ meals: result });
  } catch (err) {
    console.error('Get meals error:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch meals.' });
  }
});

// ─── POST /api/meals ──────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, nutrients } = req.body;
    if (!name || !nutrients) {
      return res.status(400).json({ message: 'name and nutrients are required.' });
    }

    const meal = await Meal.create({ userId: req.user._id, name, nutrients });
    res.status(201).json({ id: meal._id.toString() });
  } catch (err) {
    console.error('Add meal error:', err);
    res.status(500).json({ message: err.message || 'Failed to add meal.' });
  }
});

module.exports = router;
