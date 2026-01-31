/**
 * 第4回：Botに「記憶」を持たせる（SQLite）
 *
 * ゴール：
 * - /hello を実行したら
 *   - user_id と時刻を SQLite に1件保存
 *   - 固定文で返信（メンション付き）
 *
 * 前提：
 * - discord.js v14
 * - sqlite3
 * - dotenv
 */

require("dotenv").config();

const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
} = require("discord.js");

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
// data.db は「保存先のファイル」。
// なければ自動で作られます。
const dbPath = path.join(__dirname, "data.db");
const db = new sqlite3.Database(dbPath);

// テーブル（保存先の表）を作る：なければ作成、あればそのまま
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
});

// ===== 3) Discord クライアント（スラッシュコマンドだけならGuildsでOK） =====
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// ===== 4) /hello コマンド定義 =====
const commands = [
    new SlashCommandBuilder()
        .setName("hello")
        .setDescription("挨拶して、DBに記録します")
        .toJSON(),
];

// ===== 5) コマンド登録（ギルド登録：反映が速くて事故りにくい） =====
async function registerCommands() {
    const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

    console.log("🔄 スラッシュコマンド登録中...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
    });
    console.log("✅ スラッシュコマンド登録完了");
}

client.once("ready", async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    try {
        await registerCommands();
    } catch (err) {
        console.error("❌ コマンド登録に失敗:", err);
        process.exit(1);
    }
});

// ===== 6) /hello 受信 → DB保存 → 返信 =====
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "hello") return;

    // ここで「誰が実行したか」を取る
    const userId = interaction.user.id;

    // ここで「いつ実行したか」を取る
    const now = new Date().toISOString();

    // DBに1件保存する
    db.run(
        `INSERT INTO logs (user_id, created_at) VALUES (?, ?)`,
        [userId, now],
        async (err) => {
            if (err) {
                console.error("❌ DB保存エラー:", err);
                await interaction.reply({
                    content: "DBへの保存に失敗しました（ターミナルのログを確認してください）",
                    ephemeral: true,
                });
                return;
            }

            // 保存できたら返信する（メンション付き）
            await interaction.reply(`こんにちは、${interaction.user}！（記録しました）`);
        }
    );
});

// ===== 7) 起動 =====
client.login(DISCORD_TOKEN);