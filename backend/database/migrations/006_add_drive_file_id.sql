-- add drive_file_id column to video_drafts for tracking uploaded drive file

ALTER TABLE video_drafts ADD COLUMN drive_file_id TEXT;
