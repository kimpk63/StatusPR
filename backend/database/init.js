const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'status.db');
const db = new Database(dbPath);

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema);

// สร้างพนักงานตัวอย่าง (1 คน)
const insertEmployee = db.prepare(`
  INSERT OR IGNORE INTO employees (id, name) VALUES (1, 'Kim')
`);
insertEmployee.run();

// Migrations
const migrationsDir = path.join(__dirname, 'migrations');
if (fs.existsSync(migrationsDir)) {
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    try {
      const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
      db.exec(sql);
      console.log('Migration:', f);
    } catch (err) {
        if (!err.message.includes('duplicate column name')) throw err;
    }
  }
}

console.log('Database initialized at', dbPath);
db.close();
