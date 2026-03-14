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
      'trialStartedAt', 'bmi'
    ];

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    // Auto-calculate BMI if not explicitly provided but height and weight are available
    if (updates.bmi === undefined) {
      const height = updates.height !== undefined ? updates.height : req.user.height;
      const weight = updates.weight !== undefined ? updates.weight : req.user.weight;
      if (height && weight) {
        const heightInMeters = height / 100;
        if (heightInMeters > 0) {
          updates.bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
        }
      }
    }

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
