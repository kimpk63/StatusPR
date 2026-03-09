const db = require('../db');

function log(source, level, message) {
  try {
    db.prepare(
      'INSERT INTO system_logs (source, level, message) VALUES (?, ?, ?)'
    ).run(source, level, message || '');
  } catch (err) {
    console.error('[Logger]', err.message);
  }
}

function logError(source, message) {
  log(source, 'error', message);
}

function logInfo(source, message) {
  log(source, 'info', message);
}

module.exports = { log, logError, logInfo };
