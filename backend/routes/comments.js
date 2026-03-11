const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireApiKey } = require('../middleware/apiKey');
const { emitToRoom } = require('../socket');
const { authenticateToken } = require('../middleware/authMiddleware');

// mark comment as checked (manager only)
router.patch('/:id/check', requireApiKey, authenticateToken, (req, res) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const commentId = parseInt(req.params.id, 10);
    if (isNaN(commentId)) return res.status(400).json({ error: 'Invalid comment id' });

    const comment = db.prepare('SELECT * FROM video_comments WHERE id = ?').get(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE video_comments SET is_checked = 1, updated_at = ? WHERE id = ?`
    ).run(now, commentId);

    // increment checked_comments on video
    db.prepare(
      `UPDATE video_drafts SET checked_comments = checked_comments + 1 WHERE id = ?`
    ).run(comment.video_id);

    // emit socket event
    emitToRoom(`video-${comment.video_id}`, 'comment:checked', {
      comment_id: commentId,
      is_checked: true,
    });

    const updated = db.prepare('SELECT id, is_checked, updated_at FROM video_comments WHERE id = ?').get(commentId);
    res.json(updated);
  } catch (err) {
    console.error('[PATCH /api/comments/:id/check]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// delete comment
router.delete('/:id', requireApiKey, authenticateToken, (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    if (isNaN(commentId)) return res.status(400).json({ error: 'Invalid comment id' });

    const comment = db.prepare('SELECT * FROM video_comments WHERE id = ?').get(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    // only commenter or manager may delete
    if (comment.commented_by !== req.user.id && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const videoId = comment.video_id;

    // delete drawings
    db.prepare('DELETE FROM comment_drawings WHERE comment_id = ?').run(commentId);
    // delete comment
    db.prepare('DELETE FROM video_comments WHERE id = ?').run(commentId);
    // update counters
    db.prepare(
      'UPDATE video_drafts SET total_comments = total_comments - 1 WHERE id = ?'
    ).run(videoId);

    // emit delete event
    emitToRoom(`video-${videoId}`, 'comment:deleted', {
      comment_id: commentId,
      video_id: videoId,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/comments/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
