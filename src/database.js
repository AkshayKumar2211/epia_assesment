const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "epia_crm.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER,
    recipient_phone TEXT NOT NULL,
    message_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    sent_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
  );

  CREATE TABLE IF NOT EXISTS follow_ups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    follow_up_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    UNIQUE(appointment_id, follow_up_date)
  );
`);

module.exports = db;
