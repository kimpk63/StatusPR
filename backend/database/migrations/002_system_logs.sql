-- System logs สำหรับ error จาก Drive, Reporter, Watcher
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC);
