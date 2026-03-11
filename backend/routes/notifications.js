const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET รายการแจ้งเตือน (ยังไม่อ่าน หรือทั้งหมด)
router.get('/', authenticateToken, (req, res) => {
  try {
    const employeeId = req.user.id;
    const unreadOnly = req.query.unread === 'true';
    const limit = parseInt(req.query.limit, 10) || 20;

    let sql = `
      SELECT id, type, title, message, file_name, draft_number, read_at, created_at
      FROM notifications
      WHERE employee_id = ?
    `;
    const params = [employeeId];
    if (unreadOnly) {
      sql += ' AND read_at IS NULL';
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const list = db.prepare(sql).all(...params).map((r) => {
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
router.patch('/:id/read', authenticateToken, (req, res) => {
  try {
    const employeeId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const now = new Date().toISOString();
    db.prepare('UPDATE notifications SET read_at = ? WHERE id = ? AND employee_id = ?')
      .run(now, id, employeeId);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/register-device
router.post('/register-device', authenticateToken, (req, res) => {
  try {
    const employeeId = req.user.id;
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
    `).run(employeeId, deviceToken, new Date().toISOString());

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
