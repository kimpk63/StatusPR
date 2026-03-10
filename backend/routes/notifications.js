const express = require('express');
const router = express.Router();
const db = require('../db');

const EMPLOYEE_ID = 1;

// GET รายการแจ้งเตือน (ยังไม่อ่าน หรือทั้งหมด)
router.get('/', (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const limit = parseInt(req.query.limit) || 20;

    let query = `
      SELECT id, type, title, message, file_name, draft_number, read_at, created_at
      FROM notifications
      WHERE employee_id = ?
    `;
    if (unreadOnly) query += ' AND read_at IS NULL';
    query += ' ORDER BY created_at DESC LIMIT ?';

    const list = db.prepare(query).all(EMPLOYEE_ID, limit)
      .map((r) => {
        if (r.created_at && !r.created_at.endsWith('Z')) r.created_at += 'Z';
        if (r.read_at && !r.read_at.endsWith('Z')) r.read_at += 'Z';
        return r;
      });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH mark as read
router.patch('/:id/read', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const now = new Date().toISOString();
    db.prepare('UPDATE notifications SET read_at = ? WHERE id = ? AND employee_id = ?')
      .run(now, id, EMPLOYEE_ID);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/register-device
router.post('/register-device', (req, res) => {
  try {
    const { deviceToken } = req.body;
    
    if (!deviceToken) {
      return res.status(400).json({ error: 'deviceToken is required' });
    }

    db.prepare(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        updated_at TEXT NOT NULL
      )
    `).run();

    db.prepare(`
      INSERT OR REPLACE INTO device_tokens (employee_id, token, updated_at)
      VALUES (?, ?, ?)
    `).run(EMPLOYEE_ID, deviceToken, new Date().toISOString());

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
