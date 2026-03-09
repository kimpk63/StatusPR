-- Employees (1 พนักงานในระบบนี้)
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Work sessions: เริ่มทำงาน / หยุดทำงาน
CREATE TABLE IF NOT EXISTS work_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  status TEXT NOT NULL,  -- 'working' | 'offline'
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Activities: อัปโหลด, Draft, เริ่มทำงาน
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  type TEXT NOT NULL,  -- 'work_start' | 'upload' | 'draft'
  file_name TEXT,
  draft_number INTEGER,  -- 1, 2, 3... สำหรับ draft
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Notifications สำหรับแสดงบนเว็บ (อ่านแล้วสามารถ mark read ได้)
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  type TEXT NOT NULL,  -- 'work_start' | 'upload' | 'draft'
  title TEXT NOT NULL,
  message TEXT,
  file_name TEXT,
  draft_number INTEGER,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- เก็บ file_id จาก Google Drive เพื่อนับ Draft ต่อไฟล์
CREATE TABLE IF NOT EXISTS drive_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  drive_file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  draft_number INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, file_name, draft_number),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Index สำหรับ query
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_sessions_employee ON work_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
