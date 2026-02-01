/**
 * register.js
 *
 * Discord にスラッシュコマンドを登録するためのスクリプト
 *
 * 役割：
 * - /hello コマンドを Discord サーバーに登録する
 *
 * 注意：
 * - Botを起動するファイルではない
 * - コマンド定義を変更したときだけ実行すればOK
 */

require("dotenv").config();

const {
    REST,
    Routes,
    SlashCommandBuilder,
} = require("discord.js");

// ===== 1) 環境変数チェック =====
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

// ===== 2) 登録するコマンド定義 =====
const commands = [
    new SlashCommandBuilder()
        .setName("hello")
        .setDescription("挨拶する")
        .toJSON(),
];

// ===== 3) Discord に登録 =====
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        console.log("🔄 スラッシュコマンド登録中...");

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log("✅ スラッシュコマンド登録完了");
    } catch (error) {
        console.error("❌ コマンド登録に失敗しました:", error);
    }
})();
