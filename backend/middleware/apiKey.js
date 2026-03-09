const config = require('../config');

function requireApiKey(req, res, next) {
  if (!config.apiKey) {
    return next();
  }
  const key = req.headers['x-api-key'];
  if (key !== config.apiKey) {
    return res.status(401).json({ error: 'Invalid or missing x-api-key' });
  }
  next();
}

module.exports = { requireApiKey };
