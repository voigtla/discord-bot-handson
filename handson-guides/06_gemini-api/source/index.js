/**
 * 第5回：/hello（保存） + /count（件数表示）
 *
 * 重要：
 * - /count は「事実だけ」を返す（評価しない）
 * - 他ユーザーの情報は扱わない
 *
 * .env 必須：
 * - DISCORD_TOKEN
 * - CLIENT_ID
 * - GUILD_ID
 */

require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
} = require("discord.js");

const { formatText } = require("./aiFormatter");
const { saveLog, countLogsByUser } = require("./db");
const responses = require("./responses");

// ===== 環境変数チェック =====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error("❌ .env が不足しています。DISCORD_TOKEN / CLIENT_ID / GUILD_ID を設定してください。");
    process.exit(1);
}

// ===== Discord クライアント =====
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// ===== コマンド定義（第5回：hello + count）=====
const commands = [
    new SlashCommandBuilder()
        .setName("hello")
        .setDescription("挨拶して、DBに記録します")
        .toJSON(),
    new SlashCommandBuilder()
        .setName("count")
        .setDescription("自分の記録回数（事実のみ）を表示します")
        .toJSON(),
];

// ===== ギルドコマンド登録（反映が速い）=====
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

// ===== コマンド処理 =====
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const userId = interaction.user.id;
    const now = new Date().toISOString();

    try {
        // /hello：保存して、文章を整形して返す
        if (interaction.commandName === "hello") {
            await saveLog(userId, now);

            const rawText = responses.hello_ok;
            const formattedText = await formatText(rawText);

            await interaction.reply(formattedText);
            return;
        }

        // /count：件数を取得して、文章を整形して返す（評価しない）
        if (interaction.commandName === "count") {
            const count = await countLogsByUser(userId);

            const rawText = responses.count_result(count);
            const formattedText = await formatText(rawText);

            await interaction.reply(formattedText);
            return;
        }

    } catch (err) {
        console.error("❌ エラー:", err);
        // 第5回では詳細なエラーハンドリングはやりすぎない
        await interaction.reply({
            content: responses.restricted,
            ephemeral: true,
        });
    }
});

client.login(DISCORD_TOKEN);
