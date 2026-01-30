/**
 * 第5回：DB操作（保存＋件数取得）
 * - 保存: user_id と created_at
 * - 取得: user_id ごとの件数（COUNT）
 *
 * ルール：
 * - 発言内容は保存しない
 * - 他人のデータは返さない（user_id 条件必須）
 */

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

function countLogsByUser(userId) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT COUNT(*) AS count FROM logs WHERE user_id = ?`,
            [userId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row?.count ?? 0);
            }
        );
    });
}

module.exports = { saveLog, countLogsByUser };
