const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = db.prepare(`
      SELECT id, source, level, message, created_at
      FROM system_logs
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
