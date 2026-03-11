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

-- ====== Video review feature (Phase 2) ======

-- Draft videos uploaded by employees
CREATE TABLE IF NOT EXISTS video_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  uploaded_by INTEGER NOT NULL,
  drive_url TEXT,
  draft_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft', -- 'draft' | 'pending_review' | 'approved' | 'needs_revision'
  total_comments INTEGER DEFAULT 0,
  checked_comments INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS video_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  commented_by INTEGER NOT NULL, -- manager id
  comment_text TEXT NOT NULL,
  timestamp_seconds INTEGER NOT NULL,
  is_checked BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES video_drafts(id),
  FOREIGN KEY (commented_by) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS comment_drawings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  tool_type TEXT NOT NULL,
  drawing_data TEXT,
  position_x REAL,
  position_y REAL,
  position_width REAL,
  position_height REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES video_comments(id)
);

CREATE INDEX IF NOT EXISTS idx_video_comments ON video_comments(video_id, timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_comment_drawings ON comment_drawings(comment_id);

