const {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require("discord.js");

const {
    carregarJSON,
    salvarJSON
} = require("../utils/json");

const {
    carregarRanking
} = require("./ranking");

function carregarDuplas() {
    return carregarJSON("duplas.json");
}

function salvarDuplas(duplas) {
    salvarJSON("duplas.json", duplas);
}

async function atualizarPainelDuplas(client) {

    if (!process.env.DUPLAS_CHANNEL_ID) return;

    const channel = await client.channels.fetch(
        process.env.DUPLAS_CHANNEL_ID
    );

    const embed = new EmbedBuilder()
        .setColor("#FF61AD")
        .setTitle("🏁 Cadastro de Duplas")
        .setDescription(
            "Clique abaixo para cadastrar sua dupla."
        );

    const botao = new ButtonBuilder()
        .setCustomId("abrir_cadastro_dupla")
        .setLabel("Cadastrar Dupla")
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder()
        .addComponents(botao);

    const messages = await channel.messages.fetch({
        limit: 10
    });

    const botMessage = messages.find(
        msg => msg.author.id === client.user.id
    );

    if (botMessage) {

        await botMessage.edit({
            embeds: [embed],
            components: [row]
        });

    } else {

        await channel.send({
            embeds: [embed],
            components: [row]
        });
    }
}

async function atualizarRankingDuplas(client) {

    if (!process.env.RANKING_DUPLAS_CHANNEL_ID) return;

    const channel = await client.channels.fetch(
        process.env.RANKING_DUPLAS_CHANNEL_ID
    );

    const duplas = carregarDuplas();
    const ranking = carregarRanking();

    const rankingDuplas = duplas.map(dupla => {

        const pontos = dupla.integrantes.reduce(
            (total, id) => {

                const piloto = ranking.find(
                    p => String(p.id) === String(id)
                );

                return total + (
                    piloto ? piloto.pontos : 0
                );

            }, 0
        );

        return {
            nome: dupla.nome,
            integrantes: dupla.integrantes,
            pontos
        };
    });

    rankingDuplas.sort((a, b) => b.pontos - a.pontos);

    const descricao = rankingDuplas.map((dupla, index) => {

        let posicao = `#${index + 1}`;

        if (index === 0) posicao = "🥇";
        if (index === 1) posicao = "🥈";
        if (index === 2) posicao = "🥉";

        return `${posicao} **${dupla.nome}**\n` +
            `> ${dupla.pontos} pts`;
    }).join("\n\n");

    const embed = new EmbedBuilder()
        .setColor("#FF61AD")
        .setTitle("🏆 Ranking de Duplas")
        .setDescription(descricao);

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
    carregarDuplas,
    salvarDuplas,
    atualizarPainelDuplas,
    atualizarRankingDuplas
};