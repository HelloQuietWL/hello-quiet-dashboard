const {
    carregarCorridas,
    salvarCorridas
} = require("../systems/corridas");

const {
    EmbedBuilder
} = require("discord.js");

const {
    carregarRanking,
    salvarRanking
} = require("../systems/ranking");

const {
    calcularRankingMMR,
    atualizarRankingMMRDiscord,
    buscarGanhosMMRDaCorrida
} = require("../systems/mmr");

const {
    salvarWebhookState
} = require("../systems/webhookState");

module.exports = async message => {

    // WEBHOOK DE CORRIDAS
    if (
        message.channel.id === process.env.RESULTADOS_CHANNEL_ID
    ) {
        if (!message.webhookId) return;

        try {
            let conteudo = message.content || "";

            if (!conteudo && message.embeds.length > 0) {
                const embed = message.embeds[0];

                const partes = [];

                if (embed.title) partes.push(embed.title);
                if (embed.description) partes.push(embed.description);

                if (embed.fields.length > 0) {
                    embed.fields.forEach(field => {
                        partes.push(field.name);
                        partes.push(field.value);
                    });
                }

                conteudo = partes.join("\n");
            }

            console.log("CONTEÚDO RECEBIDO:");
            console.log(conteudo);

            const conteudoLimpo = conteudo
                .replace(/\*\*/g, "")
                .replace(/`/g, "");

            const linhas = conteudoLimpo
                .split("\n")
                .map(linha => linha.trim())
                .filter(linha => linha !== "");

            const linhaCorrida = linhas.find(linha =>
                linha.toLowerCase().startsWith("corrida:")
            );

            const linhaModo = linhas.find(linha =>
                linha.toLowerCase().startsWith("modo:")
            );

            if (!linhaCorrida || !linhaModo) {
                console.log("Formato inválido. Não encontrei Corrida ou Modo.");
                return;
            }

            const pista = linhaCorrida
                .replace("Corrida:", "")
                .trim();

            const modo = linhaModo
                .replace("Modo:", "")
                .trim();

            const participantes = [];

            for (const linha of linhas) {
                const regex =
                    /^(\d+)º\s*·\s*(.+?)\s*·\s*ID\s*(\d+)\s*·\s*([\d:.]+)$/;

                const match = linha.match(regex);

                if (!match) continue;

                participantes.push({
                    posicao: Number(match[1]),
                    nome: match[2].trim(),
                    id: Number(match[3]),
                    tempo: match[4]
                });
            }

            // MÍNIMO 3 PARTICIPANTES
            const participantesValidos = participantes.filter(
                participante =>
                    participante.id &&
                    participante.nome &&
                    participante.tempo
            );

            if (participantesValidos.length < 3) {

                console.log(
                    `Corrida ignorada (${participantesValidos.length} participantes).`
                );

                return;
            }

            const corridas = carregarCorridas();

            const novaCorrida = {
                numero: corridas.length + 1,
                pista,
                modo,
                data: new Date().toLocaleString("pt-BR"),
                participantes: participantesValidos
            };

            corridas.push(novaCorrida);

            salvarCorridas(corridas);

            salvarWebhookState({
                ultimaMensagemId: message.id
            });

            console.log(
                `Corrida salva: ${pista} com ${participantesValidos.length} participantes.`
            );

            calcularRankingMMR();

            const ganhosMMR = buscarGanhosMMRDaCorrida(novaCorrida.numero);

            const embedMMR = new EmbedBuilder()
                .setColor("#FF61AD")
                .setTitle(`🏁 MMR da Corrida #${novaCorrida.numero}`)
                .setDescription(
                    ganhosMMR.map(piloto => {
                        const sinal = piloto.ganhoMMR >= 0 ? "+" : "";

                        return `**${piloto.posicao}º** ${piloto.nome} | ID **${piloto.id}**\n` +
                            `> ${sinal}${piloto.ganhoMMR} MMR | ${piloto.mmrAntes} → ${piloto.mmrDepois}`;
                    }).join("\n\n")
                )
                .setFooter({
                    text: `${novaCorrida.pista} • ${novaCorrida.modo}`
                })
                .setTimestamp();

            await message.channel.send({
                embeds: [embedMMR]
            });

            atualizarRankingMMRDiscord(message.client).catch(console.log);

        } catch (error) {
            console.log("Erro ao processar webhook:");
            console.log(error);
        }

        return;
    }

    if (message.author.bot) return;

    // CANAL DE CADASTRO
    if (
        message.channel.id !==
        process.env.CADASTRO_CHANNEL_ID
    ) return;

    const args = message.content.split(" ");

    if (args.length < 2) {
        return;
    }

    const id = args[args.length - 1];
    const nome = args.slice(0, -1).join(" ");

    if (isNaN(id)) {
        return;
    }

    try {
        await message.member.setNickname(
            `${nome} | ${id}`
        );

        let ranking = carregarRanking();

        const piloto = ranking.find(
            p => String(p.id) === String(id)
        );

        if (piloto) {
            piloto.discordId = message.author.id;
        } else {
            ranking.push({
                id: Number(id),
                discordId: message.author.id,
                pontos: 0,
                corridas: 0,
                vitorias: 0,
                melhorColocacao: 999
            });
        }

        salvarRanking(ranking);

        const role = message.guild.roles.cache.get(
            process.env.CIDADAO_ROLE_ID
        );

        if (role) {
            await message.member.roles.add(role);
        }

        await message.delete();

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle("✅ Cadastro realizado")
            .setDescription(
                `👤 Nome: **${nome}**\n🆔 ID: **${id}**`
            );

        const resposta = await message.channel.send({
            content: `${message.author}`,
            embeds: [embed]
        });

        setTimeout(async () => {
            try {
                await resposta.delete();
            } catch { }
        }, 5000);

    } catch (error) {
        console.log(error);
    }
};