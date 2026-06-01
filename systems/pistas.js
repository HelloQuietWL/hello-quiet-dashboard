const { EmbedBuilder } = require("discord.js");
const { carregarJSON, salvarJSON } = require("../utils/json");

function carregarPistas() {
    return carregarJSON("pistas.json");
}

function salvarPistas(pistas) {
    salvarJSON("pistas.json", pistas);
}

async function atualizarMensagemPistas(client) {

    if (!process.env.PISTAS_CHANNEL_ID) return;

    const channel = await client.channels.fetch(
        process.env.PISTAS_CHANNEL_ID
    );

    const pistas = carregarPistas();

    let descricao = "";

    if (pistas.length === 0) {

        descricao =
            "Nenhuma pista cadastrada.\nUse /addpista.";

    } else {

        const colunas = [];

        for (let i = 0; i < 5; i++) {

            const inicio = i * 10;
            const fim = inicio + 10;

            const grupo = pistas.slice(inicio, fim);

            const texto = grupo.length > 0
                ? grupo.map((pista, index) =>
                    `**${inicio + index + 1}.** ${pista}`
                ).join("\n")
                : "";

            colunas.push(texto);
        }

        descricao = colunas
            .filter(c => c.trim() !== "")
            .join("\n\n");
    }

    const embed = new EmbedBuilder()
        .setColor("#FF61AD")
        .setTitle("🏁 PISTAS OFICIAIS")
        .setDescription(descricao)
        .setFooter({
            text: `Total de pistas: ${pistas.length}`
        });

    const messages = await channel.messages.fetch({
        limit: 10
    });

    const botMessage = messages.find(
        msg => msg.author.id === client.user.id
    );

    if (botMessage) {

        await botMessage.edit({
            embeds: [embed]
        });

    } else {

        await channel.send({
            embeds: [embed]
        });
    }
}

module.exports = {
    carregarPistas,
    salvarPistas,
    atualizarMensagemPistas
};