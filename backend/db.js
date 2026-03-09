const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config');

const dbPath = path.resolve(__dirname, config.databasePath);
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

module.exports = db;
