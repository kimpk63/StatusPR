const config = require('../config');
const db = require('../db');
const { getDriveClient } = require('./driveAuth');
const { logError } = require('./logger');
const { emitToDashboard } = require('../socket');
const { sendNotification } = require('./firebase');

const EMPLOYEE_ID = 1;
const FOLDER_ID = config.google.outputFolderId || config.google.folderId;
const FOLDER_MIME = 'application/vnd.google-apps.folder';

try {
  db.prepare(`ALTER TABLE drive_files ADD COLUMN modified_time TEXT`).run();
} catch (e) {}

if (!FOLDER_ID) {
  console.warn('GOOGLE_DRIVE_OUTPUT_FOLDER_ID (or GOOGLE_DRIVE_FOLDER_ID) not set. Drive watcher will skip listing.');
}

async function listChildren(folderId) {
  const drive = await getDriveClient();
  if (!drive) return [];
  const out = [];
  let pageToken = undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      orderBy: 'createdTime desc',
      fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime)',
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

async function listFilesRecursive(rootFolderId) {
  const queue = [rootFolderId];
  const visited = new Set();
  const files = [];

  while (queue.length) {
    const folderId = queue.shift();
    if (!folderId || visited.has(folderId)) continue;
    visited.add(folderId);

    const children = await listChildren(folderId);
    for (const item of children) {
      if (item.mimeType === FOLDER_MIME) queue.push(item.id);
      else files.push(item);
    }
  }
  return files;
}

function getNextDraftNumber(fileName) {
  const row = db.prepare(`
    SELECT MAX(draft_number) as max_draft FROM activities
    WHERE employee_id = ? AND type IN ('upload', 'draft') AND file_name = ?
  `).get(EMPLOYEE_ID, fileName);
  return (row && row.max_draft) ? row.max_draft + 1 : 1;
}

function getDeviceTokens() {
  try {
    return db.prepare('SELECT token FROM device_tokens WHERE employee_id = ?').all(EMPLOYEE_ID).map(r => r.token);
  } catch { return []; }
}

async function processNewFiles() {
  if (!FOLDER_ID) return;
  const drive = await getDriveClient();
  if (!drive) return;

  const files = await listFilesRecursive(FOLDER_ID);

  for (const file of files) {
    const existing = db.prepare(
      'SELECT * FROM drive_files WHERE employee_id = ? AND drive_file_id = ? ORDER BY id DESC LIMIT 1'
    ).get(EMPLOYEE_ID, file.id);

    let isModified = false;
    if (existing && existing.modified_time) {
      try {
        const prevMs = new Date(existing.modified_time).getTime();
        const curMs = new Date(file.modifiedTime).getTime();
        isModified = curMs > prevMs;
      } catch (_e) {
        isModified = existing.modified_time !== file.modifiedTime;
      }
    }
    if (existing && !isModified) continue;

    const draftNumber = getNextDraftNumber(file.name);

    db.prepare(`
      INSERT INTO drive_files (employee_id, drive_file_id, file_name, draft_number, modified_time)
      VALUES (?, ?, ?, ?, ?)
    `).run(EMPLOYEE_ID, file.id, file.name, draftNumber, file.modifiedTime);

    const actType = draftNumber === 1 ? 'upload' : 'draft';
    db.prepare(`
      INSERT INTO activities (employee_id, type, file_name, draft_number, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      EMPLOYEE_ID,
      actType,
      file.name,
      draftNumber,
      draftNumber === 1 ? `อัปโหลดไฟล์: ${file.name}` : `อัปโหลด Draft ${draftNumber}: ${file.name}`
    );
    const activityIdRow = db.prepare('SELECT last_insert_rowid() as id').get();
    const activity = activityIdRow ? db.prepare('SELECT * FROM activities WHERE id = ?').get(activityIdRow.id) : null;

    const title = draftNumber === 1 ? 'New Upload' : `Draft ${draftNumber}`;
    const message = `${file.name}${draftNumber > 1 ? ` - Draft ${draftNumber}` : ''} uploaded`;

    db.prepare(`
      INSERT INTO notifications (employee_id, type, title, message, file_name, draft_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(EMPLOYEE_ID, actType, title, message, file.name, draftNumber);

    if (activity && emitToDashboard) {
      emitToDashboard('activity', activity);
      emitToDashboard('notification', { title, message, file_name: file.name, draft_number: draftNumber });
    }

    getDeviceTokens().forEach(token => sendNotification(token, title, message));

    console.log(`[Drive] ${existing ? 'Modified' : 'New'}: ${file.name} Draft ${draftNumber}`);
  }
}

async function runWatchCycle() {
  try {
    await processNewFiles();
  } catch (err) {
    console.error('[Drive Watcher]', err.message);
    try { logError('drive_watcher', err.message); } catch (_) {}
  }
}

if (require.main === module) {
  const cron = require('node-cron');
  runWatchCycle();
  cron.schedule('*/1 * * * *', runWatchCycle);
  console.log('Drive watcher started (check every 1 min). Set GOOGLE_DRIVE_FOLDER_ID and run OAuth first.');
} else {
  module.exports = { listChildren, listFilesRecursive, processNewFiles, runWatchCycle };
}