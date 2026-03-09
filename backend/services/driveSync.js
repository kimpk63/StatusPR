/**
 * Sync ครั้งแรก: เติม drive_files ด้วยไฟล์ที่มีอยู่แล้วใน Folder
 * เพื่อไม่ให้ระบบนับไฟล์เก่าทั้งหมดเป็น "อัปโหลดใหม่"
 * รัน: node services/driveSync.js
 */
const db = require('../db');
const { getDriveClient } = require('./driveAuth');
const config = require('../config');

const EMPLOYEE_ID = 1;
const FOLDER_ID = config.google.outputFolderId || config.google.folderId;
const FOLDER_MIME = 'application/vnd.google-apps.folder';

// ensure schema has modified_time column
try {
  db.prepare(`ALTER TABLE drive_files ADD COLUMN modified_time TEXT`).run();
} catch (e) {
  // ignore if already present
}

async function listChildren(drive, folderId) {
  const out = [];
  let pageToken = undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      orderBy: 'createdTime desc',
      fields: 'nextPageToken, files(id, name, mimeType, createdTime)',
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    out.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return out;
}

async function listFilesRecursive(drive, rootFolderId) {
  const queue = [rootFolderId];
  const visited = new Set();
  const files = [];

  while (queue.length) {
    const folderId = queue.shift();
    if (!folderId || visited.has(folderId)) continue;
    visited.add(folderId);

    const children = await listChildren(drive, folderId);
    for (const item of children) {
      if (item.mimeType === FOLDER_MIME) queue.push(item.id);
      else files.push(item);
    }
  }
  return files;
}

async function sync() {
  if (!FOLDER_ID) {
    console.log('Set GOOGLE_DRIVE_OUTPUT_FOLDER_ID (or GOOGLE_DRIVE_FOLDER_ID) first.');
    process.exit(1);
  }
  const drive = await getDriveClient();
  if (!drive) {
    console.log('Run OAuth first: open http://localhost:3001/api/drive/auth');
    process.exit(1);
  }
  const allFiles = await listFilesRecursive(drive, FOLDER_ID);
  const files = (allFiles || []).sort(
    (a, b) => new Date(a.createdTime || 0) - new Date(b.createdTime || 0)
  );
  const insert = db.prepare(`
    INSERT OR IGNORE INTO drive_files (employee_id, drive_file_id, file_name, draft_number, modified_time)
    VALUES (?, ?, ?, ?, ?)
  `);
  const draftPerName = {};
  for (const f of files) {
    draftPerName[f.name] = (draftPerName[f.name] || 0) + 1;
    const draftNumber = draftPerName[f.name];
    insert.run(EMPLOYEE_ID, f.id, f.name, draftNumber, f.modifiedTime);
  }
  console.log('Synced', files.length, 'files into drive_files. New uploads from now on will be logged.');
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});
