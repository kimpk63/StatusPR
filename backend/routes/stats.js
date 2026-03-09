const express = require('express');
const router = express.Router();
const db = require('../db');

const EMPLOYEE_ID = 1;

// วันนี้ (ตาม timezone ของ server) — ใช้ date string YYYY-MM-DD
function todayLocal() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// GET /api/stats/today — Productivity Summary
router.get('/today', (req, res) => {
  try {
    const day = req.query.date || todayLocal();
    const start = day + 'T00:00:00.000Z';
    const end = day + 'T23:59:59.999Z';

    const uploads = db.prepare(`
      SELECT COUNT(*) as c FROM activities
      WHERE employee_id = ? AND type IN ('upload', 'draft') AND date(created_at, 'localtime') = date(?)
    `).get(EMPLOYEE_ID, day);
    const totalUploads = (uploads && uploads.c) || 0;

    const drafts = db.prepare(`
      SELECT COUNT(*) as c FROM activities
      WHERE employee_id = ? AND type = 'draft' AND date(created_at, 'localtime') = date(?)
    `).get(EMPLOYEE_ID, day);
    const totalDrafts = (drafts && drafts.c) || 0;

    const lastActivity = db.prepare(`
      SELECT created_at FROM activities WHERE employee_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(EMPLOYEE_ID);

    const sessions = db.prepare(`
      SELECT started_at, ended_at FROM work_sessions
      WHERE employee_id = ? AND date(started_at, 'localtime') = date(?)
    `).all(EMPLOYEE_ID, day);

    let workingTimeMs = 0;
    for (const s of sessions) {
      const endTime = s.ended_at ? new Date(s.ended_at).getTime() : Date.now();
      workingTimeMs += endTime - new Date(s.started_at).getTime();
    }

    res.json({
      date: day,
      totalUploadsToday: totalUploads,
      totalDraftsToday: totalDrafts,
      lastActivityAt: lastActivity ? lastActivity.created_at : null,
      workingTimeMs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/draft-summary — File Name | Total Drafts | Last Update
router.get('/draft-summary', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT file_name, COUNT(*) as total_drafts, MAX(created_at) as last_update
      FROM activities
      WHERE employee_id = ? AND type IN ('upload', 'draft') AND file_name IS NOT NULL AND file_name != ''
      GROUP BY file_name
      ORDER BY last_update DESC
    `).all(EMPLOYEE_ID)
    .map(r => {
      if (r.last_update && !r.last_update.endsWith('Z')) r.last_update += 'Z';
      return r;
    });

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
