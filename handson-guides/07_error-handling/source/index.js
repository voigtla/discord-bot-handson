require("dotenv").config();

const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { Client, GatewayIntentBits } = require("discord.js");

const { formatText } = require("./aiFormatter.js");
const safeReply = require("./safeReply.js");

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

// ===== /hello と /count（safeReply で包む） =====
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // ---- /hello ----
    if (interaction.commandName === "hello") {
        await safeReply(interaction, async () => {
            const userId = interaction.user.id;
            const now = new Date().toISOString();

            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO logs (user_id, created_at) VALUES (?, ?)`,
                    [userId, now],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            const rawText = `こんにちは、${interaction.user}！（記録しました）`;
            const formatted = await formatText(rawText);

            await interaction.reply(formatted);
        });
        return;
    }

    // ---- /count ----
    if (interaction.commandName === "count") {
        await safeReply(interaction, async () => {
            const userId = interaction.user.id;

            const count = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT COUNT(*) as cnt FROM logs WHERE user_id = ?`,
                    [userId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row.cnt);
                    }
                );
            });

            const rawText = `これまでの記録回数は ${count} 回です。`;
            const formatted = await formatText(rawText);

            await interaction.reply(formatted);
        });
    }
});

// ===== 起動 =====
client.login(process.env.DISCORD_TOKEN);