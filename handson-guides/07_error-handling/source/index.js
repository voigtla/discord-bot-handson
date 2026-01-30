/**
 * 第7回：エラー処理・フォールバック設計（最小実装）
 * - Gemini（文章整形）が落ちても Bot は止めない
 * - DB が落ちても「変なことを言わない」
 * - ユーザーには固定の安全文言だけ返す
 */

require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const responses = require("./responses");
const { initDb, saveLog, countLogsByUser } = require("./db");
const { formatText } = require("./aiFormatter");
const { safeReply } = require("./safeReply");

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once("ready", async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    await initDb();
    console.log("✅ DB initialized");
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const userId = interaction.user?.id ?? "unknown";
    const now = new Date().toISOString();

    try {
        // /hello：保存して、整形に失敗したら固定文にフォールバックして返す
        if (interaction.commandName === "hello") {
            await saveLog(userId, now);

            await safeReply(interaction, async () => {
                const rawText = responses.hello_ok;
                const formatted = await formatText(rawText);
                return formatted;
            });

            return;
        }

        // /count：件数を返す（評価しない）。整形に失敗したらフォールバック
        if (interaction.commandName === "count") {
            const count = await countLogsByUser(userId);

            await safeReply(interaction, async () => {
                const rawText = responses.count_result(count);
                const formatted = await formatText(rawText);
                return formatted;
            });

            return;
        }

        // 想定外コマンド：第7回では広げない（固定文で終了）
        await safeReply(interaction, async () => responses.fallback);
    } catch (err) {
        // index.js 側の最終フォールバック（ここは第6回までの catch を残すイメージ）
        console.error("❌ interaction handler failed:", err);
        // ここでは必ず reply を返す。既に返信済みの場合は followUp。
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: responses.fallback, ephemeral: true });
        } else {
            await interaction.reply({ content: responses.fallback, ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
