import { Client, GatewayIntentBits, Events } from "discord.js";
import "dotenv/config";

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, () => {
    console.log("Bot is ready");
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "hello") {
        await interaction.reply("こんにちは！");
    }
});

client.login(process.env.DISCORD_TOKEN);