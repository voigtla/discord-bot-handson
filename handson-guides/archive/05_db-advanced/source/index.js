/**
 * 第5回：保存したデータを「読む」
 *
 * ゴール：
 * - /hello → user_id と時刻を SQLite に1件保存
 * - /count → 自分の記録回数（件数）を事実として返す（評価しない）
 *
 * 前提：
 * - discord.js v14
 * - sqlite3
 * - dotenv
 */

require("dotenv").config();

const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const { Client, GatewayIntentBits } = require("discord.js");

// ===== 1) 環境変数チェック（初学者が詰まるので最初に止める） =====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error("❌ .env が不足しています。以下を設定してください：");
    console.error("- DISCORD_TOKEN");
    console.error("- CLIENT_ID");
    console.error("- GUILD_ID");
    process.exit(1);
}

// ===== 2) SQLite セットアップ（ファイル1個でOK） =====
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

// ===== 3) Discord クライアント =====
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log("✅ Bot is ready（コマンド登録は register.js で行います）");
});

// ===== 4) /hello と /count を処理 =====
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // ---- /hello：保存して返信 ----
    if (interaction.commandName === "hello") {
        const userId = interaction.user.id;
        const now = new Date().toISOString();

        db.run(
            `INSERT INTO logs (user_id, created_at) VALUES (?, ?)`,
            [userId, now],
            async (err) => {
                if (err) {
                    console.error("❌ DB保存エラー:", err);
                    await interaction.reply({
                        content:
                            "DBへの保存に失敗しました（ターミナルのログを確認してください）",
                        ephemeral: true,
                    });
                    return;
                }

                await interaction.reply(`こんにちは、${interaction.user}！（記録しました）`);
            }
        );
        return;
    }

    // ---- /count：自分の件数だけ返す（評価しない） ----
    if (interaction.commandName === "count") {
        const userId = interaction.user.id;

        db.get(
            `SELECT COUNT(*) as cnt FROM logs WHERE user_id = ?`,
            [userId],
            async (err, row) => {
                if (err) {
                    console.error("❌ DB取得エラー:", err);
                    await interaction.reply({
                        content:
                            "件数の取得に失敗しました（ターミナルのログを確認してください）",
                        ephemeral: true,
                    });
                    return;
                }

                const count = row?.cnt ?? 0;

                // 事実だけ返す（評価しない）
                await interaction.reply(`これまでの記録回数は ${count} 回です。`);
            }
        );
        return;
    }
});

// ===== 5) 起動 =====
client.login(DISCORD_TOKEN);