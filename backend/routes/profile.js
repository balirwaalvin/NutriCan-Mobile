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

// ─── PATCH /api/profile/password ──────────────────────────────────────────────
router.patch('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    // Verify current password
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password.' });
    }

    req.user.passwordHash = newPassword; // The pre-save hook will hash it
    await req.user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: err.message || 'Failed to reset password.' });
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
