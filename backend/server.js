const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config');
const { setServer } = require('./socket');
let db = require('./db');
const statusRouter = require('./routes/status');

// make sure the database is initialized (tables exist)
try {
  // run a simple query to detect missing table
  db.prepare('SELECT 1 FROM employees LIMIT 1').get();
} catch (e) {
  console.warn('Database not initialized, running init script...');
  require('./database/init');
  // reload db connection after creation
  db = require('./db');
}

const EMPLOYEE_ID = 1;
const PING_TIMEOUT_MS = 2 * 60 * 1000;

const app = express();
// allow CORS from specific origins (frontend URL) or wildcard
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/status', statusRouter);
app.use('/api/activities', require('./routes/activities'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/drive', require('./routes/drive'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/logs', require('./routes/logs'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST'] 
  },
});
setServer(io);

io.on('connection', (socket) => {
  socket.emit('connected', { ts: new Date().toISOString() });
});

// Heartbeat: ถ้าไม่มี ping เกิน 2 นาที → Offline
function checkPingTimeout() {
  try {
    const emp = db.prepare('SELECT last_ping FROM employees WHERE id = ?').get(EMPLOYEE_ID);
    if (!emp || !emp.last_ping) return;
    const elapsed = Date.now() - new Date(emp.last_ping).getTime();
    if (elapsed < PING_TIMEOUT_MS) return;
    const current = db.prepare(`
      SELECT id FROM work_sessions WHERE employee_id = ? AND ended_at IS NULL
    `).get(EMPLOYEE_ID);
    if (!current) return;
    const now = new Date().toISOString();
    db.prepare('UPDATE work_sessions SET ended_at = ? WHERE employee_id = ? AND ended_at IS NULL')
      .run(now, EMPLOYEE_ID);
    db.prepare(`
      INSERT INTO activities (employee_id, type, description) VALUES (?, 'stop_work', 'Offline (no heartbeat)')
    `).run(EMPLOYEE_ID);
    io.emit('status', { status: 'offline', startedAt: null });
    io.emit('notification', { title: 'Offline', message: 'พนักงานไม่มีสัญญาณ (no heartbeat)' });
  } catch (err) {
    console.error('[Heartbeat check]', err.message);
  }
}
setInterval(checkPingTimeout, 30 * 1000);

server.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
  if (process.env.ENABLE_DRIVE_WATCH === '1') {
    const { runWatchCycle } = require('./services/driveWatcher');
    runWatchCycle();
    setInterval(runWatchCycle, 60 * 1000);
    console.log('Drive watcher enabled (every 1 min).');
  }
});
