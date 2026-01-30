const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "data.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
});

function saveLog(userId, createdAt) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO logs (user_id, created_at) VALUES (?, ?)`,
            [userId, createdAt],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

module.exports = { saveLog };
