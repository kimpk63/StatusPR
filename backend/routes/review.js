const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// GET /api/review/queue - manager only
router.get('/queue', authenticateToken, authorizeRole('manager'), (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT v.id, v.file_name, v.uploaded_by, u.name as employee_name,
             v.status, v.total_comments, v.checked_comments,
             v.duration, v.file_size, v.created_at
      FROM video_drafts v
      JOIN users u ON v.uploaded_by = u.id
      WHERE v.status IN ('pending_review','needs_revision')
      ORDER BY v.created_at DESC
    `).all();

    const result = rows.map((v) => ({
      id: v.id,
      file_name: v.file_name,
      uploaded_by: v.uploaded_by,
      employee_name: v.employee_name,
      status: v.status,
      total_comments: v.total_comments,
      checked_comments: v.checked_comments,
      duration: v.duration,
      durationFormatted: v.duration != null ? require('../utils/videoProcessor').formatDuration(v.duration) : null,
      fileSize: v.file_size,
      fileSizeFormatted: v.file_size != null ? require('../utils/videoProcessor').formatFileSize(v.file_size) : null,
      createdAt: v.created_at
    }));

    res.json(result);
  } catch (err) {
    console.error('[GET /api/review/queue]', err.message);
    res.status(500).json({ error: 'Failed to fetch review queue' });
  }
});

// GET /api/review/stats - manager only
router.get('/stats', authenticateToken, authorizeRole('manager'), (req, res) => {
  try {
    const totalPending = db.prepare(
      `SELECT COUNT(*) as cnt FROM video_drafts WHERE status = 'pending_review'`
    ).get().cnt;
    const totalNeeds = db.prepare(
      `SELECT COUNT(*) as cnt FROM video_drafts WHERE status = 'needs_revision'`
    ).get().cnt;
    const recentVideos = db.prepare(
      `SELECT id, file_name, status, uploaded_by, created_at
       FROM video_drafts
       ORDER BY created_at DESC
       LIMIT 5`
    ).all();

    res.json({
      totalPendingReview: totalPending,
      totalNeedsRevision: totalNeeds,
      recentVideos
    });
  } catch (err) {
    console.error('[GET /api/review/stats]', err.message);
    res.status(500).json({ error: 'Failed to fetch review stats' });
  }
});

module.exports = router;