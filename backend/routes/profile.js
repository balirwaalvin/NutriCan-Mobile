const router = require('express').Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// ─── GET /api/profile ─────────────────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  res.json({ profile: req.user });
});

// ─── PATCH /api/profile ───────────────────────────────────────────────────────
router.patch('/', requireAuth, async (req, res) => {
  try {
    const allowed = [
      'name', 'age', 'height', 'weight',
      'cancerType', 'cancerStage', 'otherConditions',
      'treatmentStages', 'plan', 'isVerified', 'documentsSubmitted',
    ];

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ profile: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: err.message || 'Failed to update profile.' });
  }
});

// ─── POST /api/profile/upgrade ────────────────────────────────────────────────
router.post('/upgrade', requireAuth, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { plan: 'Premium' } },
      { new: true }
    );
    res.json({ profile: updated });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Upgrade failed.' });
  }
});

module.exports = router;
