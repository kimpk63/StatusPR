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

module.exports = router;
