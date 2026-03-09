const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireApiKey } = require('../middleware/apiKey');
const { emitToDashboard } = require('../socket');

const EMPLOYEE_ID = 1;
const PING_TIMEOUT_MS = 2 * 60 * 1000; // 2 นาที

function isOfflineByPing(lastPing) {
  if (!lastPing) return true;
  return Date.now() - new Date(lastPing).getTime() > PING_TIMEOUT_MS;
}

// GET สถานะพนักงานปัจจุบัน (working | idle | offline)
router.get('/', (req, res) => {
  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(EMPLOYEE_ID);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const lastPing = employee.last_ping || null;
    const offline = isOfflineByPing(lastPing);

    const currentSession = db.prepare(`
      SELECT * FROM work_sessions 
      WHERE employee_id = ? AND ended_at IS NULL 
      ORDER BY started_at DESC LIMIT 1
    `).get(EMPLOYEE_ID);

    const lastActivity = db.prepare(`
      SELECT * FROM activities WHERE employee_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(EMPLOYEE_ID);

    let status = 'offline';
    if (!offline) {
      status = currentSession ? 'working' : 'idle';
    }

    res.json({
      id: employee.id,
      name: employee.name,
      status,
      lastPing: lastPing ? (lastPing.endsWith('Z') ? lastPing : lastPing + 'Z') : null,
      startedAt: currentSession ? (currentSession.started_at.endsWith('Z') ? currentSession.started_at : currentSession.started_at + 'Z') : null,
      lastActivityAt: lastActivity ? (lastActivity.created_at.endsWith('Z') ? lastActivity.created_at : lastActivity.created_at + 'Z') : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/status/ping — Employee Reporter ส่งทุก 30 วินาที (ต้องมี x-api-key ถ้า API_KEY ตั้งไว้)
router.post('/ping', requireApiKey, (req, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare('UPDATE employees SET last_ping = ? WHERE id = ?').run(now, EMPLOYEE_ID);

    const { status } = req.body; // 'working' | 'idle'
    const currentSession = db.prepare(`
      SELECT id FROM work_sessions WHERE employee_id = ? AND ended_at IS NULL
    `).get(EMPLOYEE_ID);

    if (status === 'working' && !currentSession) {
      db.prepare(`
        INSERT INTO work_sessions (employee_id, status, started_at) VALUES (?, 'working', ?)
      `).run(EMPLOYEE_ID, now);
      db.prepare(`
        INSERT INTO activities (employee_id, type, description) VALUES (?, 'start_work', 'พนักงานเริ่มทำงาน')
      `).run(EMPLOYEE_ID);
      db.prepare(`
        INSERT INTO notifications (employee_id, type, title, message) 
        VALUES (?, 'start_work', 'เริ่มทำงาน', 'พนักงานเริ่มทำงาน (Premiere Pro Active)')
      `).run(EMPLOYEE_ID);
      emitToDashboard('status', { status: 'working', startedAt: now });
      emitToDashboard('notification', { title: 'เริ่มทำงาน', message: 'พนักงานเริ่มทำงาน' });
    } else if (status === 'idle' && currentSession) {
      db.prepare(`
        UPDATE work_sessions SET ended_at = ? WHERE employee_id = ? AND ended_at IS NULL
      `).run(now, EMPLOYEE_ID);
      db.prepare(`
        INSERT INTO activities (employee_id, type, description) VALUES (?, 'stop_work', 'พนักงานหยุดทำงาน')
      `).run(EMPLOYEE_ID);
      emitToDashboard('status', { status: 'idle', startedAt: null });
    }

    res.json({ ok: true, lastPing: now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST อัปเดตสถานะ (working | offline) — ใช้ร่วมกับ ping
router.post('/', requireApiKey, (req, res) => {
  try {
    const { status } = req.body;
    if (!['working', 'offline', 'idle'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE employees SET last_ping = ? WHERE id = ?').run(now, EMPLOYEE_ID);

    if (status === 'working') {
      const existing = db.prepare(`
        SELECT id FROM work_sessions WHERE employee_id = ? AND ended_at IS NULL
      `).get(EMPLOYEE_ID);

      if (!existing) {
        db.prepare(`
          INSERT INTO work_sessions (employee_id, status, started_at) VALUES (?, 'working', ?)
        `).run(EMPLOYEE_ID, now);
        db.prepare(`
          INSERT INTO activities (employee_id, type, description) VALUES (?, 'start_work', 'พนักงานเริ่มทำงาน')
        `).run(EMPLOYEE_ID);
        db.prepare(`
          INSERT INTO notifications (employee_id, type, title, message) 
          VALUES (?, 'start_work', 'เริ่มทำงาน', 'พนักงานเริ่มทำงาน (Premiere Pro Active)')
        `).run(EMPLOYEE_ID);
        emitToDashboard('status', { status: 'working', startedAt: now });
        emitToDashboard('notification', { title: 'เริ่มทำงาน', message: 'พนักงานเริ่มทำงาน' });
      }
    } else if (status === 'offline' || status === 'idle') {
      db.prepare(`
        UPDATE work_sessions SET ended_at = ? WHERE employee_id = ? AND ended_at IS NULL
      `).run(now, EMPLOYEE_ID);
      if (status === 'offline') {
        db.prepare(`
          INSERT INTO activities (employee_id, type, description) VALUES (?, 'stop_work', 'พนักงานหยุดทำงาน (Offline)')
        `).run(EMPLOYEE_ID);
      }
      emitToDashboard('status', { status, startedAt: null });
    }

    const current = db.prepare(`
      SELECT * FROM work_sessions WHERE employee_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1
    `).get(EMPLOYEE_ID);

    res.json({
      status,
      startedAt: current ? current.started_at : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.isOfflineByPing = isOfflineByPing;
module.exports.PING_TIMEOUT_MS = PING_TIMEOUT_MS;
