require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    REST,
    Routes
} = require("discord.js");

const commands = require("./commands");
const interactionCreate = require("./events/interactionCreate");
const messageCreate = require("./events/messageCreate");

const {
    atualizarRanking
} = require("./systems/ranking");

const {
    atualizarHallOfFame
} = require("./systems/hallOfFame");

const {
    atualizarPainelDuplas
} = require("./systems/duplas");

const {
    atualizarMensagemPistas
} = require("./systems/pistas");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const rest = new REST({
    version: "10"
}).setToken(process.env.TOKEN);

const {
    atualizarRankingDuplas
} = require("./systems/duplas");

const {
    verificarMensagensPendentes
} = require("./systems/verificarWebhook");

async function registrarComandos() {
    await rest.put(
        Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID
        ),
        { body: commands }
    );

    console.log("Comandos registrados.");
}

client.once("ready", async () => {
    console.log(`Bot online como ${client.user.tag}`);

    await verificarMensagensPendentes(client);

    atualizarRanking(client).catch(console.log);
    atualizarHallOfFame(client).catch(console.log);
    atualizarPainelDuplas(client).catch(console.log);
    atualizarMensagemPistas(client).catch(console.log);
    atualizarRankingDuplas(client).catch(console.log);
});

client.on("interactionCreate", interactionCreate);
client.on("messageCreate", messageCreate);

registrarComandos();
client.login(process.env.TOKEN);