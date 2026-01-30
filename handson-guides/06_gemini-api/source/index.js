/**
 * 第6回：AIを文章整形専用で使う
 *
 * ゴール：
 * - Botの返答文を AI に通しても意味が変わらない
 */

require("dotenv").config();

const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { Client, GatewayIntentBits } = require("discord.js");
const { formatText } = require("./aiFormatter.js");

// ===== SQLite =====
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

// ===== Discord =====
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// ===== /hello と /count =====
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "hello") {
        const userId = interaction.user.id;
        const now = new Date().toISOString();

        db.run(
            `INSERT INTO logs (user_id, created_at) VALUES (?, ?)`,
            [userId, now],
            async (err) => {
                if (err) {
                    await interaction.reply({
                        content: "処理に失敗しました。",
                        ephemeral: true,
                    });
                    return;
                }

                const rawText = `こんにちは、${interaction.user}！（記録しました）`;
                const formatted = await formatText(rawText);

                await interaction.reply(formatted);
            }
        );
        return;
    }

    if (interaction.commandName === "count") {
        const userId = interaction.user.id;

        db.get(
            `SELECT COUNT(*) as cnt FROM logs WHERE user_id = ?`,
            [userId],
            async (err, row) => {
                if (err) {
                    await interaction.reply({
                        content: "処理に失敗しました。",
                        ephemeral: true,
                    });
                    return;
                }

                const rawText = `これまでの記録回数は ${row.cnt} 回です。`;
                const formatted = await formatText(rawText);

                await interaction.reply(formatted);
            }
        );
    }
});

// ===== 起動 =====
client.login(process.env.DISCORD_TOKEN);