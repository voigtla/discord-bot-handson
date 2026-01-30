require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { saveLog } = require("./db");
const responses = require("./responses");

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "hello") return;

    const userId = interaction.user.id;
    const now = new Date().toISOString();

    try {
        await saveLog(userId, now);
        await interaction.reply(`${responses.normal}`);
    } catch (err) {
        console.error(err);
        await interaction.reply({
            content: responses.restricted,
            ephemeral: true,
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
