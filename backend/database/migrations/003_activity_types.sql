-- Activity types: start_work, stop_work, upload, draft, export, open_project
UPDATE activities SET type = 'start_work' WHERE type = 'work_start';
