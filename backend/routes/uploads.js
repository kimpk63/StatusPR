const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const { getDriveClient } = require('../services/driveAuth');
const config = require('../config');
const { requireApiKey } = require('../middleware/apiKey');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateVideoFile } = require('../middleware/validation');

const path = require('path');
const videoProcessor = require('../utils/videoProcessor');
const os = require('os');
const fs = require('fs').promises;

// multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// helper to upload to google drive
async function uploadToDrive(fileBuffer, fileName) {
  const folderId = config.google.outputFolderId || config.google.folderId;
  if (!folderId) throw new Error('GOOGLE_DRIVE_OUTPUT_FOLDER_ID not configured');
  const drive = await getDriveClient();
  if (!drive) throw new Error('Google Drive client unavailable');
  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: 'video/mp4', // mime stored in file
      body: Buffer.from(fileBuffer),
    },
    fields: 'id, webViewLink, mimeType',
  });
  return res.data;
}

// POST /api/uploads/video
router.post(
  '/video',
  requireApiKey,
  authenticateToken,
  upload.single('file'),
  validateVideoFile,
  async (req, res) => {
    try {
      const { fileName } = req.body;
      const file = req.file;
      if (!fileName || typeof fileName !== 'string') {
        return res.status(400).json({ error: 'fileName is required' });
      }
      // check same-name draft count
      const existing = db
        .prepare('SELECT MAX(draft_number) as maxDraft FROM video_drafts WHERE file_name = ?')
        .get(fileName);
      const draftNumber = (existing && existing.maxDraft ? existing.maxDraft : 0) + 1;

      // calculate metadata by writing buffer to temporary file
      const tmpDir = os.tmpdir();
      const tmpPath = path.join(tmpDir, `upload_${Date.now()}_${file.originalname}`);
      await fs.writeFile(tmpPath, file.buffer);
      let metadata = {};
      try {
        metadata = await videoProcessor.getVideoMetadata(tmpPath);
      } catch (e) {
        console.warn('[Upload] metadata extraction failed', e.message);
      } finally {
        // remove temp file
        fs.unlink(tmpPath).catch(() => {});
      }

      // upload to drive
      const driveInfo = await uploadToDrive(file.buffer, fileName);
      const driveUrl = driveInfo.webViewLink || null;
      const driveFileId = driveInfo.id || null;

      const insert = db.prepare(
        `INSERT INTO video_drafts
          (file_name, uploaded_by, drive_url, drive_file_id, draft_number, status, duration, file_size)
         VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)`
      );
      const result = insert.run(
        fileName,
        req.user.id,
        driveUrl,
        driveFileId,
        draftNumber,
        metadata.duration || 0,
        metadata.fileSize || 0
      );
      const videoId = result.lastInsertRowid;

      const video = db
        .prepare('SELECT * FROM video_drafts WHERE id = ?')
        .get(videoId);
      res.status(201).json(video);
    } catch (err) {
      console.error('[POST /api/uploads/video]', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/uploads/videos
router.get('/videos', requireApiKey, authenticateToken, (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    let sql = `SELECT v.*,
       (SELECT COUNT(*) FROM video_comments c WHERE c.video_id = v.id) as comment_count
       FROM video_drafts v`;
    const params = [];
    if (req.user.role !== 'manager') {
      sql += ' WHERE v.uploaded_by = ?';
      params.push(req.user.id);
    }
    sql += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10));
    params.push(parseInt(offset, 10));

    const rows = db.prepare(sql).all(...params);
    const enriched = rows.map((v) => {
      if (v.duration != null) {
        return {
          ...v,
          duration: v.duration,
          durationFormatted: videoProcessor.formatDuration(v.duration),
          fileSize: v.file_size || 0,
          fileSizeFormatted: videoProcessor.formatFileSize(v.file_size || 0)
        };
      }
      return v;
    });
    res.json(enriched);
  } catch (err) {
    console.error('[GET /api/uploads/videos]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/uploads/videos/:id
router.delete('/videos/:id', requireApiKey, authenticateToken, async (req, res) => {
  try {
    const vid = parseInt(req.params.id, 10);
    if (isNaN(vid)) return res.status(400).json({ error: 'Invalid video id' });
    const video = db.prepare('SELECT * FROM video_drafts WHERE id = ?').get(vid);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    // ownership check
    if (video.uploaded_by !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // delete comments and drawings
    db.prepare('DELETE FROM comment_drawings WHERE comment_id IN (SELECT id FROM video_comments WHERE video_id = ?)').run(vid);
    db.prepare('DELETE FROM video_comments WHERE video_id = ?').run(vid);
    // delete video record
    db.prepare('DELETE FROM video_drafts WHERE id = ?').run(vid);
    // optionally delete file from drive
    if (video.drive_file_id) {
      try {
        const drive = await getDriveClient();
        if (drive) {
          await drive.files.delete({ fileId: video.drive_file_id });
        }
      } catch (err) {
        console.warn('Failed to delete drive file', err.message);
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/uploads/videos/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
