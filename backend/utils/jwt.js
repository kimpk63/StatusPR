const jwt = require('jsonwebtoken');

function generateToken(userId, role) {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function generateRefreshToken() {
  return jwt.sign(
    { rand: Math.random() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { generateToken, generateRefreshToken, verifyToken };