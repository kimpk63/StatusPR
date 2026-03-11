-- add duration and file_size columns to video_drafts
ALTER TABLE video_drafts ADD COLUMN duration INTEGER DEFAULT 0;
ALTER TABLE video_drafts ADD COLUMN file_size INTEGER DEFAULT 0;
