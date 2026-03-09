const express = require('express');
const router = express.Router();
const { getDriveClient, getOrRefreshTokens } = require('../services/driveAuth');

// OAuth: เริ่มต้นลิงก์ไปยัง Google
router.get('/auth', (req, res) => {
  const { getAuthUrl } = require('../services/driveAuth');
  const url = getAuthUrl();
  if (!url) return res.status(500).json({ error: 'Google Drive not configured' });
  res.redirect(url);
});

// OAuth callback หลัง login Google
router.get('/callback', async (req, res) => {
  const { handleCallback } = require('../services/driveAuth');
  try {
    await handleCallback(req.query.code);
    res.send('<script>window.close();</script><p>เชื่อมต่อ Google Drive สำเร็จ สามารถปิดแท็บนี้ได้</p>');
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// GET สถานะการเชื่อมต่อ
router.get('/status', (req, res) => {
  const { hasTokens } = require('../services/driveAuth');
  res.json({ connected: hasTokens() });
});

module.exports = router;
