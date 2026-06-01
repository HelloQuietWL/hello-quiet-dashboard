const { EmbedBuilder } = require("discord.js");
const { carregarJSON, salvarJSON } = require("../utils/json");

function carregarRanking() {
    return carregarJSON("ranking.json");
}

function salvarRanking(ranking) {
    salvarJSON("ranking.json", ranking);
}

async function atualizarRanking(client) {
    if (!process.env.RANKING_CHANNEL_ID) return;

    const channel = await client.channels.fetch(process.env.RANKING_CHANNEL_ID);

    let ranking = carregarRanking();

    ranking = ranking.sort((a, b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        return a.melhorColocacao - b.melhorColocacao;
    });

    const descricao = ranking.length === 0
        ? "Nenhum resultado registrado ainda."
        : ranking.map((piloto, index) => {
            let posicao = `#${index + 1}`;

            if (index === 0) posicao = "🥇";
            if (index === 1) posicao = "🥈";
            if (index === 2) posicao = "🥉";

            return `${posicao} **ID ${piloto.id}**\n` +
                `> **${piloto.pontos} pts** • Melhor: **${piloto.melhorColocacao}º** • Corridas: **${piloto.corridas}**`;
        }).join("\n\n");

    const embed = new EmbedBuilder()
        .setColor("#FF61AD")
        .setTitle("🏆 Ranking Oficial")
        .setDescription(descricao)
        .setFooter({
            text: "Atualizado automaticamente após cada corrida"
        })
        .setTimestamp();

    const messages = await channel.messages.fetch({ limit: 10 });

    const botMessage = messages.find(
        msg => msg.author.id === client.user.id
    );

    if (botMessage) {
        await botMessage.edit({ embeds: [embed] });
    } else {
        await channel.send({ embeds: [embed] });
    }
}

module.exports = {
    carregarRanking,
    salvarRanking,
    atualizarRanking
};