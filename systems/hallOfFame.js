const { EmbedBuilder } = require("discord.js");

const {
    carregarRanking
} = require("./ranking");

async function atualizarHallOfFame(client) {

    if (!process.env.HALL_OF_FAME_CHANNEL_ID) return;

    const channel = await client.channels.fetch(
        process.env.HALL_OF_FAME_CHANNEL_ID
    );

    let ranking = carregarRanking();

    ranking = ranking.sort((a, b) => {

        if (b.pontos !== a.pontos) {
            return b.pontos - a.pontos;
        }

        return b.vitorias - a.vitorias;
    });

    const top3 = ranking.slice(0, 3);

    const embed = new EmbedBuilder()
        .setColor("#FF61AD")
        .setTitle("🏆 HALL OF FAME")
        .setDescription(
            "Os melhores pilotos da temporada."
        );

    for (let i = 0; i < top3.length; i++) {

        const piloto = top3[i];

        let membro = null;

        try {

            if (piloto.discordId) {

                membro = await channel.guild.members.fetch(
                    piloto.discordId
                );
            }

        } catch {}

        const nomeDiscord = membro
            ? (membro.nickname || membro.user.displayName)
            : "Desconhecido";

        const avatar = membro
            ? membro.user.displayAvatarURL({
                dynamic: true,
                size: 1024
            })
            : null;

        let emoji = "🏎️";

        if (i === 0) emoji = "🥇";
        if (i === 1) emoji = "🥈";
        if (i === 2) emoji = "🥉";

        embed.addFields({
            name: `${emoji} ${nomeDiscord}`,
            value:
                `🏆 Vitórias: **${piloto.vitorias || 0}**\n` +
                `🏁 Corridas: **${piloto.corridas || 0}**\n` +
                `📈 Pontos: **${piloto.pontos}**`
        });

        if (i === 0 && avatar) {
            embed.setThumbnail(avatar);
        }
    }

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
    atualizarHallOfFame
};