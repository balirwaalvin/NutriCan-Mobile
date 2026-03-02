const router = require('express').Router();
const User = require('../models/User');
const { signToken, requireAuth } = require('../middleware/auth');

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const {
      email, password, name, age, height, weight,
      cancerType, cancerStage, otherConditions, treatmentStages,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password should be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'This email address is already in use.' });
    }

    const user = await User.create({
      email,
      passwordHash: password, // pre-save hook hashes this
      name,
      age,
      height,
      weight,
      cancerType,
      cancerStage,
      otherConditions: otherConditions || [],
      treatmentStages: treatmentStages || [],
      plan: 'Free',
      isVerified: false,
      documentsSubmitted: false,
    });

    const token = signToken(user);
    res.status(201).json({ token, profile: user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: err.message || 'Signup failed.' });
  }
});

// ─── POST /api/auth/signin ────────────────────────────────────────────────────
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({ token, profile: user });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ message: err.message || 'Sign in failed.' });
  }
});

// ─── POST /api/auth/guest ────────────────────────────────────────────────────
router.post('/guest', async (req, res) => {
  try {
    // Generate a unique throwaway email for the guest
    const guestEmail = `guest_${Date.now()}@nutrican.guest`;

    const user = await User.create({
      email: guestEmail,
      name: 'Guest',
      age: 30,
      height: 165,
      weight: 60,
      cancerType: 'Cervical',
      cancerStage: 'Early Stage (I-II)',
      otherConditions: [],
      treatmentStages: [],
      plan: 'Free',
      isGuest: true,
    });

    const token = signToken(user);
    res.status(201).json({ token, profile: user });
  } catch (err) {
    console.error('Guest login error:', err);
    res.status(500).json({ message: err.message || 'Guest login failed.' });
  }
});

// ─── GET /api/auth/me  (session check) ───────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json({ profile: req.user });
});

module.exports = router;
