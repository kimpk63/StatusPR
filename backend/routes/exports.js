const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { generateCommentsPDF } = require('../utils/pdfExport');
const { formatDuration, formatFileSize } = require('../utils/videoProcessor');

// helper to ensure video access
function checkVideoPermission(user, video) {
  if (!video) return false;
  if (user.id === video.uploaded_by) return true;
  if (user.role === 'manager') return true;
  return false;
}

// GET /api/exports/video/:id/comments (PDF)
router.get('/video/:id/comments', authenticateToken, async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const video = db.prepare('SELECT * FROM video_drafts WHERE id = ?').get(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    if (!checkVideoPermission(req.user, video)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const comments = db.prepare(`
      SELECT c.*, u.name as manager_name
      FROM video_comments c
      JOIN users u ON c.commented_by = u.id
      WHERE c.video_id = ?
      ORDER BY c.timestamp_seconds ASC
    `).all(videoId);

    // generate pdf in temp folder
    const tmpDir = path.join(__dirname, '..', 'tmp');
    await fs.mkdir(tmpDir, { recursive: true });
    const pdfPath = await generateCommentsPDF(
      video.file_name,
      comments,
      formatDuration(video.duration || 0)
    );

    res.download(pdfPath, `${video.file_name}_comments.pdf`, async (err) => {
      if (err) console.error('Download error:', err);
      try {
        await fs.unlink(pdfPath);
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// GET /api/exports/video/:id/progress (JSON)
router.get('/video/:id/progress', authenticateToken, (req, res) => {
  try {
    const videoId = parseInt(req.params.id);

    const video = db.prepare('SELECT * FROM video_drafts WHERE id = ?').get(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    if (!checkVideoPermission(req.user, video)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const totalComments = video.total_comments || 0;
    const resolvedComments = video.checked_comments || 0;
    const progressPercent = totalComments > 0 ? Math.round((resolvedComments / totalComments) * 100) : 0;

    res.json({
      videoId: video.id,
      videoName: video.file_name,
      status: video.status,
      totalComments,
      resolvedComments,
      pendingComments: totalComments - resolvedComments,
      progressPercent,
      duration: formatDuration(video.duration || 0),
      fileSize: formatFileSize(video.file_size || 0),
      createdAt: video.created_at,
      updatedAt: video.updated_at
    });
  } catch (error) {
    console.error('Progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

router.use(authenticateToken);
module.exports = router;
