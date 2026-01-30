/**
 * db
 * - SQLite に「最小情報だけ」保存する
 * - 発言内容などは保存しない（メンタル系サーバー前提）
 */

const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = path.join(__dirname, "data.sqlite");

let db;

function openDb() {
    return new sqlite3.Database(DB_PATH);
}

async function initDb() {
    if (!db) db = openDb();

    await run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, function (err, row) {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function saveLog(userId, isoTime) {
    if (!db) db = openDb();
    await run(`INSERT INTO logs (user_id, created_at) VALUES (?, ?)`, [userId, isoTime]);
}

async function countLogsByUser(userId) {
    if (!db) db = openDb();
    const row = await get(`SELECT COUNT(*) as count FROM logs WHERE user_id = ?`, [userId]);
    return row?.count ?? 0;
}

module.exports = {
    initDb,
    saveLog,
    countLogsByUser,
};
