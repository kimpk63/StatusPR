const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireApiKey } = require('../middleware/apiKey');
const { validateInput } = require('../middleware/validation');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// utilities
const email = require('../utils/email');
const videoProcessor = require('../utils/videoProcessor');

// real-time helper
const { emitToRoom } = require('../socket');

// utility to fetch video by id
function getVideo(id) {
  return db.prepare('SELECT * FROM video_drafts WHERE id = ?').get(id);
}

// listing with filters
router.get('/', requireApiKey, authenticateToken, (req, res) => {
  try {
    let { status, sort, limit = 50, offset = 0 } = req.query;
    const params = [];
    let whereClauses = [];
    if (req.user.role !== 'manager') {
      whereClauses.push('v.uploaded_by = ?');
      params.push(req.user.id);
    }
    if (status) {
      whereClauses.push('v.status = ?');
      params.push(status);
    }
    if (req.query.search) {
      whereClauses.push('v.file_name LIKE ?');
      params.push(`%${req.query.search}%`);
    }
    let sql = `SELECT v.*,
      (SELECT COUNT(*) FROM video_comments c WHERE c.video_id = v.id) as comment_count
      FROM video_drafts v`;
    if (whereClauses.length) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }
    if (sort === 'oldest') {
      sql += ' ORDER BY v.created_at ASC';
    } else {
      sql += ' ORDER BY v.created_at DESC';
    }
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10));
    params.push(parseInt(offset, 10));

    const rows = db.prepare(sql).all(...params);

    // attach formatted metadata if present
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
    console.error('[GET /api/videos]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/videos/:id/comments
router.post(
  '/:id/comments',
  requireApiKey,
  authenticateToken,
  authorizeRole('manager'),
  validateInput({
    comment_text: { required: true, type: 'string' },
    timestamp_seconds: {
      required: true,
      type: 'number',
      validator: (n) => n >= 0,
    },
    drawings: { required: false },
  }),
  (req, res) => {
  try {
    const videoId = parseInt(req.params.id, 10);
    if (isNaN(videoId)) return res.status(400).json({ error: 'Invalid video id' });

    const video = getVideo(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const { comment_text, timestamp_seconds, drawings } = req.body;
    if (!comment_text || typeof comment_text !== 'string' || !comment_text.trim()) {
      return res.status(400).json({ error: 'comment_text is required' });
    }
    if (
      timestamp_seconds === undefined ||
      typeof timestamp_seconds !== 'number' ||
      timestamp_seconds < 0
    ) {
      return res.status(400).json({ error: 'timestamp_seconds must be a non‑negative number' });
    }

    // determine manager/user id from authenticated user
    const commentedBy = req.user?.id || req.body.commented_by || null;
    if (!commentedBy) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const insert = db.prepare(
      `INSERT INTO video_comments (video_id, commented_by, comment_text, timestamp_seconds)
       VALUES (?, ?, ?, ?)`
    );
    const result = insert.run(videoId, commentedBy, comment_text.trim(), timestamp_seconds);
    const commentId = result.lastInsertRowid;

    // insert drawings if provided
    if (Array.isArray(drawings)) {
      const dstmt = db.prepare(
        `INSERT INTO comment_drawings
         (comment_id, tool_type, drawing_data, position_x, position_y, position_width, position_height)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      const insertMany = db.transaction((items) => {
        for (const d of items) {
          dstmt.run(
            commentId,
            d.tool_type,
            typeof d.drawing_data === 'string' ? d.drawing_data : JSON.stringify(d.drawing_data || {}),
            d.position?.x || null,
            d.position?.y || null,
            d.position?.width || null,
            d.position?.height || null
          );
        }
      });
      insertMany(drawings);
    }

    // update counters on video
    db.prepare(`
      UPDATE video_drafts
      SET total_comments = total_comments + 1
      WHERE id = ?
    `).run(videoId);

    // return created comment
    const comment = db.prepare('SELECT * FROM video_comments WHERE id = ?').get(commentId);
    comment.drawings = db.prepare('SELECT * FROM comment_drawings WHERE comment_id = ?').all(commentId);

    // emit socket event to room
    const managerNameRow = db.prepare('SELECT name FROM employees WHERE id = ?').get(commentedBy);
    const managerName = managerNameRow ? managerNameRow.name : null;
    emitToRoom(`video-${videoId}`, 'comment:added', {
      id: comment.id,
      video_id: videoId,
      comment_text: comment.comment_text,
      timestamp_seconds: comment.timestamp_seconds,
      manager_name: managerName,
      drawings: comment.drawings,
    });

    // send email notification to employee if available
    try {
      const videoData = db.prepare('SELECT uploaded_by, file_name FROM video_drafts WHERE id = ?').get(videoId);
      const employee = db.prepare('SELECT email FROM users WHERE id = ?').get(videoData.uploaded_by);
      const manager = req.user;
      if (employee && employee.email) {
        email.sendCommentNotification(
          manager.name,
          employee.email,
          videoData.file_name,
          req.body.comment_text,
          videoId
        );
      }
    } catch (e) {
      console.warn('[Email] failed to send comment notification', e.message);
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error('[POST /api/videos/:id/comments]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/videos/:id - fetch video and all comments
router.get('/:id', requireApiKey, authenticateToken, (req, res) => {
  try {
    const videoId = parseInt(req.params.id, 10);
    if (isNaN(videoId)) return res.status(400).json({ error: 'Invalid video id' });

    const video = getVideo(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    // fetch comments and drawings
    const rows = db.prepare(
      `SELECT c.*, d.id as drawing_id, d.tool_type, d.drawing_data,
              d.position_x, d.position_y, d.position_width, d.position_height,
              e.name as manager_name
       FROM video_comments c
       LEFT JOIN comment_drawings d ON c.id = d.comment_id
       LEFT JOIN employees e ON c.commented_by = e.id
       WHERE c.video_id = ?
       ORDER BY c.timestamp_seconds`
    ).all(videoId);

    const comments = [];
    rows.forEach(r => {
      let c = comments.find(x => x.id === r.id);
      if (!c) {
        c = {
          id: r.id,
          commented_by: {
            id: r.commented_by,
            name: r.manager_name || null
          },
          comment_text: r.comment_text,
          timestamp_seconds: r.timestamp_seconds,
          is_checked: !!r.is_checked,
          created_at: r.created_at,
          updated_at: r.updated_at,
          drawings: []
        };
        comments.push(c);
      }
      if (r.drawing_id) {
        c.drawings.push({
          id: r.drawing_id,
          tool_type: r.tool_type,
          drawing_data: r.drawing_data,
          position: {
            x: r.position_x,
            y: r.position_y,
            width: r.position_width,
            height: r.position_height
          }
        });
      }
    });

    // include metadata fields
    const response = {
      id: video.id,
      file_name: video.file_name,
      drive_url: video.drive_url,
      draft_number: video.draft_number,
      status: video.status,
      total_comments: video.total_comments,
      checked_comments: video.checked_comments,
      uploaded_by: video.uploaded_by,
      comments
    };
    if (video.duration != null) {
      response.duration = video.duration;
      response.durationFormatted = videoProcessor.formatDuration(video.duration);
    }
    if (video.file_size != null) {
      response.fileSize = video.file_size;
      response.fileSizeFormatted = videoProcessor.formatFileSize(video.file_size);
    }

    res.json(response);
  } catch (err) {
    console.error('[GET /api/videos/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/videos/:id/status
router.patch(
  '/:id/status',
  requireApiKey,
  authenticateToken,
  validateInput({
    status: {
      required: true,
      type: 'string',
      validator: (s) => ['draft','pending_review','approved','needs_revision'].includes(s),
    },
  }),
  (req, res) => {
  try {
    const videoId = parseInt(req.params.id, 10);
    if (isNaN(videoId)) return res.status(400).json({ error: 'Invalid video id' });

    const { status } = req.body;
    const allowed = ['draft', 'pending_review', 'approved', 'needs_revision'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const video = getVideo(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (video.uploaded_by !== req.user.id && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE video_drafts SET status = ?, updated_at = ? WHERE id = ?`
    ).run(status, now, videoId);

    // emit status change
    emitToRoom(`video-${videoId}`, 'video:status-changed', {
      video_id: videoId,
      status,
    });

    // send appropriate email notification
    try {
      const videoData = db.prepare('SELECT uploaded_by, file_name FROM video_drafts WHERE id = ?').get(videoId);
      const employee = db.prepare('SELECT email FROM users WHERE id = ?').get(videoData.uploaded_by);
      const manager = req.user;
      const commentCount = db.prepare('SELECT COUNT(*) as count FROM video_comments WHERE video_id = ? AND is_checked = 0').get(videoId).count;
      if (employee && employee.email) {
        if (status === 'approved') {
          email.sendVideoApprovedNotification(employee.email, videoData.file_name, manager.name);
        } else if (status === 'needs_revision') {
          email.sendNeedsRevisionNotification(employee.email, videoData.file_name, manager.name, commentCount, videoId);
        }
      }
    } catch (e) {
      console.warn('[Email] failed to send status notification', e.message);
    }

    res.json({ id: videoId, status, updated_at: now });
  } catch (err) {
    console.error('[PATCH /api/videos/:id/status]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
