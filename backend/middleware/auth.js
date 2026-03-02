const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware that verifies the JWT in the Authorization header and attaches
 * the authenticated user to `req.user`.
 *
 * Expects: `Authorization: Bearer <token>`
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Helper – sign a JWT for a given user document.
 */
const signToken = (user) =>
  jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

module.exports = { requireAuth, signToken };
