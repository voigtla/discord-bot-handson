/**
 * safeReply.js
 *
 * 役割：
 * - 中で何が失敗しても
 * - ユーザーには安全な固定文だけを返す
 */

const { fallback } = require("./responses.js");

module.exports = async function safeReply(interaction, handler) {
    try {
        const result = await handler();
        return result;
    } catch (err) {
        console.error("❌ エラー発生:", err);

        if (interaction.replied || interaction.deferred) return;

        await interaction.reply({
            content: fallback,
            ephemeral: true,
        });
    }
};
