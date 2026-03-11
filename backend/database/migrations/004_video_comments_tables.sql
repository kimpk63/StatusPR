-- migration to add video review tables for Phase 2

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
  commented_by INTEGER NOT NULL,
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
