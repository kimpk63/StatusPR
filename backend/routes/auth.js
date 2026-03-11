const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/authMiddleware');

// registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['employee', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    const hashedPassword = await hashPassword(password);
    const result = db.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, hashedPassword, role);
    const userId = result.lastInsertRowid;
    const accessToken = generateToken(userId, role);
    const refreshToken = generateRefreshToken();
    db.prepare(
      'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES (?, ?, datetime("now", "+30 days"))'
    ).run(userId, refreshToken);
    res.json({
      id: userId,
      name,
      email,
      role,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const accessToken = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken();
    db.prepare(
      'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES (?, ?, datetime("now", "+30 days"))'
    ).run(user.id, refreshToken);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// refresh
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    const session = db.prepare(
      'SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > datetime("now")'
    ).get(refreshToken);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
    const accessToken = generateToken(user.id, user.role);
    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// logout
router.post('/logout', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      db.prepare('DELETE FROM sessions WHERE refresh_token = ?').run(refreshToken);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// get current user
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

module.exports = router;