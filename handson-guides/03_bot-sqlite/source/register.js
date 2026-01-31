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

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

// ここで読むだけ（値はコードに書かない）
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// 足りないなら、理由を出しすぎずに止める（スクショ事故防止）
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error("❌ 実行に必要な設定が不足しています。(.env を確認)");
    process.exit(1);
}

const commands = [
    new SlashCommandBuilder()
        .setName("hello")
        .setDescription("挨拶する")
        .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        console.log("🔄 コマンド登録中...");
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        });
        console.log("✅ Command registered");
    } catch (err) {
        console.error("❌ 登録に失敗しました（ターミナルのログを確認）");
        process.exit(1);
    }
})();