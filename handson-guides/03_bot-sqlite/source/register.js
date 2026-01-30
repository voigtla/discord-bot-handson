import { REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

// ① ここに貼る（Developer Portalでコピーした Application ID）
const CLIENT_ID = "ここにApplication IDを貼る";

// ② ここに貼る（Discordでコピーした サーバーID）
const GUILD_ID = "ここにサーバーIDを貼る";

const commands = [
    new SlashCommandBuilder()
        .setName("hello")
        .setDescription("挨拶する")
        .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
    });

    console.log("Command registered");
})();