-- Heartbeat: เก็บ last_ping ของพนักงาน
ALTER TABLE employees ADD COLUMN last_ping DATETIME;
