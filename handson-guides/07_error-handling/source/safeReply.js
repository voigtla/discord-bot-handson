/**
 * safeReply
 * - どんな失敗が起きても、ユーザーには安全な固定文だけを返す
 * - 例外は console にだけ出す（ユーザーに詳細は見せない）
 */

const responses = require("./responses");

async function safeReply(interaction, textGenerator) {
    try {
        const text = await textGenerator();

        // text が空っぽなら安全側へ倒す
        const safeText = (typeof text === "string" && text.trim().length > 0)
            ? text
            : responses.fallback;

        // すでに返信済みなら followUp に回す（Discordの二重reply防止）
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: safeText, ephemeral: true });
        } else {
            await interaction.reply(safeText);
        }
    } catch (err) {
        console.error("❌ safeReply failed:", err);

        // ここも二重reply回避
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: responses.fallback, ephemeral: true });
        } else {
            await interaction.reply({ content: responses.fallback, ephemeral: true });
        }
    }
}

module.exports = { safeReply };
