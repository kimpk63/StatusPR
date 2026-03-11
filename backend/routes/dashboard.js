const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireApiKey } = require('../middleware/apiKey');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/dashboard/stats
router.get('/stats', requireApiKey, authenticateToken, (req, res) => {
  try {
    // counts apply to role; employees see only their own
    const baseWhere = req.user.role === 'manager' ? '' : 'WHERE uploaded_by = ?';
    const params = req.user.role === 'manager' ? [] : [req.user.id];

    const total = db
      .prepare(`SELECT COUNT(*) as count FROM video_drafts ${baseWhere}`)
      .get(...params).count;
    const draft = db
      .prepare(`SELECT COUNT(*) as count FROM video_drafts ${baseWhere} ${baseWhere ? 'AND' : 'WHERE'} status = 'draft'`)
      .get(...params).count;
    const approved = db
      .prepare(`SELECT COUNT(*) as count FROM video_drafts ${baseWhere} ${baseWhere ? 'AND' : 'WHERE'} status = 'approved'`)
      .get(...params).count;
    const needsRevision = db
      .prepare(`SELECT COUNT(*) as count FROM video_drafts ${baseWhere} ${baseWhere ? 'AND' : 'WHERE'} status = 'needs_revision'`)
      .get(...params).count;
    const recent = db
      .prepare(`SELECT * FROM video_drafts ${baseWhere} ORDER BY created_at DESC LIMIT 10`)
      .all(...params);

    res.json({
      totalVideos: total,
      draftCount: draft,
      approvedCount: approved,
      needsRevisionCount: needsRevision,
      recentVideos: recent,
    });
  } catch (err) {
    console.error('[GET /api/dashboard/stats]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
