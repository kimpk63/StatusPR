const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireApiKey } = require('../middleware/apiKey');
const { emitToDashboard } = require('../socket');

const EMPLOYEE_ID = 1;
const ACTIVITY_TYPES = ['start_work', 'stop_work', 'upload', 'draft', 'export', 'open_project'];

// GET รายการกิจกรรมทั้งหมด
// helper adds trailing Z to timestamps so client treats them as UTC
function fixTimestamp(obj, fields = ['created_at']) {
  if (!obj) return obj;
  for (const f of fields) {
    if (obj[f] && typeof obj[f] === 'string' && !obj[f].endsWith('Z')) {
      obj[f] = obj[f] + 'Z';
    }
  }
  return obj;
}

router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const activities = db.prepare(`
      SELECT id, type, file_name, draft_number, description, created_at
      FROM activities
      WHERE employee_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(EMPLOYEE_ID, limit)
    .map((r) => fixTimestamp(r));

    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST บันทึกการอัปโหลด (Drive Watcher - ไม่บังคับ API key)
router.post('/upload', (req, res) => {
  try {
    const { file_name, draft_number } = req.body;
    if (!file_name) return res.status(400).json({ error: 'file_name required' });

    const draftNum = draft_number || 1;
    const type = draftNum === 1 ? 'upload' : 'draft';
    const desc = draftNum === 1
      ? `อัปโหลดไฟล์: ${file_name}`
      : `อัปโหลด Draft ${draftNum}: ${file_name}`;

    db.prepare(`
      INSERT INTO activities (employee_id, type, file_name, draft_number, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(EMPLOYEE_ID, type, file_name, draftNum, desc);

    const title = draftNum === 1 ? 'New Upload' : `Draft ${draftNum}`;
    const message = `${file_name}${draftNum > 1 ? ` - Draft ${draftNum}` : ''} uploaded`;
    db.prepare(`
      INSERT INTO notifications (employee_id, type, title, message, file_name, draft_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(EMPLOYEE_ID, type, title, message, file_name, draftNum);

    const row = db.prepare('SELECT last_insert_rowid() as id').get();
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(row.id);
    emitToDashboard('activity', activity);
    emitToDashboard('notification', { title, message, file_name, draft_number: draftNum });
    res.status(201).json(activity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST บันทึก Export (Employee Reporter - ต้องมี x-api-key)
router.post('/export', requireApiKey, (req, res) => {
  try {
    const { file_name, draft_number } = req.body;
    if (!file_name) return res.status(400).json({ error: 'file_name required' });

    const draftNum = draft_number || 1;
    const desc = `Export Draft ${draftNum}: ${file_name}`;

    db.prepare(`
      INSERT INTO activities (employee_id, type, file_name, draft_number, description)
      VALUES (?, 'export', ?, ?, ?)
    `).run(EMPLOYEE_ID, file_name, draftNum, desc);

    db.prepare(`
      INSERT INTO notifications (employee_id, type, title, message, file_name, draft_number)
      VALUES (?, 'export', 'Export Video', ?, ?, ?)
    `).run(EMPLOYEE_ID, desc, file_name, draftNum);

    const row = db.prepare('SELECT last_insert_rowid() as id').get();
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(row.id);
    emitToDashboard('activity', activity);
    emitToDashboard('notification', { title: 'Export Video', message: desc, file_name, draft_number: draftNum });
    res.status(201).json(activity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST บันทึก Open Project (Employee Reporter)
router.post('/open_project', requireApiKey, (req, res) => {
  try {
    const { file_name } = req.body;
    if (!file_name) return res.status(400).json({ error: 'file_name required' });

    const desc = `open_project ${file_name}`;
    db.prepare(`
      INSERT INTO activities (employee_id, type, file_name, description)
      VALUES (?, 'open_project', ?, ?)
    `).run(EMPLOYEE_ID, file_name, desc);

    const row = db.prepare('SELECT last_insert_rowid() as id').get();
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(row.id);
    emitToDashboard('activity', activity);
    res.status(201).json(activity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
