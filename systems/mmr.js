const { carregarCorridas } = require("./corridas");
const { carregarJSON, salvarJSON } = require("../utils/json");
const { EmbedBuilder } = require("discord.js");

const MMR_INICIAL = 1000;
const K_BASE = 24;
const GANHO_MAXIMO = 60;
const PERDA_MAXIMA = -40;

function chanceEsperada(mmrJogador, mmrAdversario) {
    return 1 / (1 + Math.pow(10, (mmrAdversario - mmrJogador) / 400));
}

function limitar(valor, min, max) {
    return Math.max(min, Math.min(max, valor));
}

function tempoParaMs(tempo) {
    if (!tempo || typeof tempo !== "string") return 0;

    const partes = tempo.split(":");

    if (partes.length === 2) {
        const minutos = Number(partes[0]);
        const segundos = Number(partes[1]);
        return (minutos * 60 + segundos) * 1000;
    }

    return 0;
}

function calcularIntegridadeCorrida(corrida, rankingAtual) {
    let score = 1.0;
    const motivos = [];

    const participantes = corrida.participantes || [];

    for (const participante of participantes) {
        const piloto = rankingAtual.find(p => p.id === participante.id);

        if (!piloto) continue;

        const statsPista = piloto.desempenhoPorPista?.[corrida.pista];

        if (!statsPista || !statsPista.tempos || statsPista.tempos.length < 3) {
            continue;
        }

        const tempoAtual = tempoParaMs(participante.tempo);

        const temposAntigos = statsPista.tempos
            .map(tempoParaMs)
            .filter(t => t > 0);

        if (temposAntigos.length < 3) continue;

        const mediaTempo =
            temposAntigos.reduce((a, b) => a + b, 0) / temposAntigos.length;

        if (!mediaTempo || tempoAtual <= 0) continue;

        const diferencaPercentual =
            ((tempoAtual - mediaTempo) / mediaTempo) * 100;

        if (diferencaPercentual > 35) {
            score -= 0.25;
            motivos.push(
                `${participante.nome} ficou mais de 35% pior que sua média na pista.`
            );
        } else if (diferencaPercentual > 20) {
            score -= 0.15;
            motivos.push(
                `${participante.nome} ficou mais de 20% pior que sua média na pista.`
            );
        }
    }

    const jogadoresFortesMal = participantes.filter(participante => {
        const piloto = rankingAtual.find(p => p.id === participante.id);

        if (!piloto) return false;

        return (
            piloto.mmr >= 1300 &&
            participante.posicao > Math.ceil(participantes.length / 2)
        );
    });

    if (jogadoresFortesMal.length >= 2) {
        score -= 0.20;
        motivos.push(
            "Múltiplos jogadores com MMR alto terminaram abaixo do esperado."
        );
    }

    score = limitar(score, 0.25, 1);

    return {
        score: Number(score.toFixed(2)),
        motivos
    };
}

function calcularRankingMMR() {
    const corridas = carregarCorridas();

    let ranking = [];

    function pegarPiloto(id, nome) {
        let piloto = ranking.find(p => p.id === id);

        if (!piloto) {
            piloto = {
                id,
                nomeAtual: nome,
                nome,
                historicoNomes: [nome],
                mmr: MMR_INICIAL,
                corridas: 0,
                vitorias: 0,
                top3: 0,
                winrate: 0,
                podiumRate: 0,
                mediaColocacao: 0,
                melhorColocacao: 999,
                totalPosicoes: 0,
                ganhoTotalMMR: 0,
                ultimasCorridas: [],
                desempenhoPorPista: {}
            };

            ranking.push(piloto);
        }

        piloto.nomeAtual = nome;
        piloto.nome = nome;

        if (!piloto.historicoNomes) {
            piloto.historicoNomes = [];
        }

        if (nome && !piloto.historicoNomes.includes(nome)) {
            piloto.historicoNomes.push(nome);
        }

        return piloto;
    }

    for (const corrida of corridas) {
        const participantes = corrida.participantes || [];

        if (participantes.length < 3) continue;

        const totalParticipantes = participantes.length;
        const pilotosDaCorrida = participantes.map(p =>
            pegarPiloto(p.id, p.nome)
        );

        const integridade = calcularIntegridadeCorrida(corrida, ranking);

        const mmrAntes = {};

        pilotosDaCorrida.forEach(piloto => {
            mmrAntes[piloto.id] = piloto.mmr;
        });

        const ganhos = {};

        participantes.forEach(participante => {
            ganhos[participante.id] = 0;
        });

        for (let i = 0; i < participantes.length; i++) {
            for (let j = 0; j < participantes.length; j++) {
                if (i === j) continue;

                const jogador = participantes[i];
                const adversario = participantes[j];

                const jogadorVenceu = jogador.posicao < adversario.posicao;

                const esperado = chanceEsperada(
                    mmrAntes[jogador.id],
                    mmrAntes[adversario.id]
                );

                const resultado = jogadorVenceu ? 1 : 0;

                ganhos[jogador.id] +=
                    (K_BASE * (resultado - esperado)) /
                    (totalParticipantes - 1);
            }
        }

        for (const participante of participantes) {
            const piloto = pegarPiloto(participante.id, participante.nome);

            let bonus = 0;

            if (participante.posicao === 1) {
                bonus += 8;
            }

            if (participante.posicao <= 3) {
                bonus += 3;
            }

            bonus += Math.max(0, totalParticipantes - 3) * 1.5;

            if (participante.posicao === 1 && participantes.length > 1) {
                const primeiroTempo = tempoParaMs(participante.tempo);
                const segundoTempo = tempoParaMs(participantes[1].tempo);

                const diferencaSegundos =
                    (segundoTempo - primeiroTempo) / 1000;

                if (diferencaSegundos >= 10) bonus += 8;
                else if (diferencaSegundos >= 5) bonus += 5;
                else if (diferencaSegundos >= 2) bonus += 2;
            }

            let ganhoFinal = ganhos[participante.id] + bonus;

            ganhoFinal = ganhoFinal * integridade.score;

            ganhoFinal = limitar(
                ganhoFinal,
                PERDA_MAXIMA,
                GANHO_MAXIMO
            );

            ganhoFinal = Number(ganhoFinal.toFixed(2));

            piloto.mmr = Number((piloto.mmr + ganhoFinal).toFixed(2));

            if (piloto.mmr < 100) {
                piloto.mmr = 100;
            }

            piloto.corridas += 1;
            piloto.totalPosicoes += participante.posicao;
            piloto.ganhoTotalMMR += ganhoFinal;

            if (participante.posicao === 1) {
                piloto.vitorias += 1;
            }

            if (participante.posicao <= 3) {
                piloto.top3 += 1;
            }

            if (participante.posicao < piloto.melhorColocacao) {
                piloto.melhorColocacao = participante.posicao;
            }

            if (!piloto.desempenhoPorPista[corrida.pista]) {
                piloto.desempenhoPorPista[corrida.pista] = {
                    corridas: 0,
                    vitorias: 0,
                    top3: 0,
                    melhorColocacao: 999,
                    tempos: []
                };
            }

            const pistaStats = piloto.desempenhoPorPista[corrida.pista];

            pistaStats.corridas += 1;

            if (participante.posicao === 1) {
                pistaStats.vitorias += 1;
            }

            if (participante.posicao <= 3) {
                pistaStats.top3 += 1;
            }

            if (participante.posicao < pistaStats.melhorColocacao) {
                pistaStats.melhorColocacao = participante.posicao;
            }

            pistaStats.tempos.push(participante.tempo);

            piloto.ultimasCorridas.push({
                corrida: corrida.numero,
                pista: corrida.pista,
                modo: corrida.modo,
                posicao: participante.posicao,
                tempo: participante.tempo,
                mmrAntes: mmrAntes[participante.id],
                mmrDepois: piloto.mmr,
                ganhoMMR: ganhoFinal,
                integridadeCorrida: integridade.score,
                motivosSuspeita: integridade.motivos
            });

            piloto.ultimasCorridas = piloto.ultimasCorridas.slice(-10);
        }
    }

    ranking = ranking.map(piloto => {
        piloto.winrate = piloto.corridas > 0
            ? Number(((piloto.vitorias / piloto.corridas) * 100).toFixed(2))
            : 0;

        piloto.podiumRate = piloto.corridas > 0
            ? Number(((piloto.top3 / piloto.corridas) * 100).toFixed(2))
            : 0;

        piloto.mediaColocacao = piloto.corridas > 0
            ? Number((piloto.totalPosicoes / piloto.corridas).toFixed(2))
            : 0;

        piloto.ganhoTotalMMR = Number(piloto.ganhoTotalMMR.toFixed(2));

        return piloto;
    });

    ranking.sort((a, b) => {
        if (b.mmr !== a.mmr) return b.mmr - a.mmr;
        if (b.winrate !== a.winrate) return b.winrate - a.winrate;
        return a.mediaColocacao - b.mediaColocacao;
    });

    salvarJSON("ranking_mmr.json", ranking);

    return ranking;
}

function buscarGanhosMMRDaCorrida(numeroCorrida) {
    const ranking = carregarRankingMMR();

    const ganhos = [];

    for (const piloto of ranking) {
        const corrida = piloto.ultimasCorridas.find(
            c => c.corrida === numeroCorrida
        );

        if (!corrida) continue;

        ganhos.push({
            id: piloto.id,
            nome: piloto.nomeAtual || piloto.nome,
            posicao: corrida.posicao,
            mmrAntes: corrida.mmrAntes,
            mmrDepois: corrida.mmrDepois,
            ganhoMMR: corrida.ganhoMMR
        });
    }

    ganhos.sort((a, b) => a.posicao - b.posicao);

    return ganhos;
}

function carregarRankingMMR() {
    return carregarJSON("ranking_mmr.json");
}

async function atualizarRankingMMRDiscord(client) {
    if (!process.env.MMR_RANKING_CHANNEL_ID) return;

    const channel = await client.channels.fetch(
        process.env.MMR_RANKING_CHANNEL_ID
    );

    const ranking = carregarRankingMMR().slice(0, 16);

    const descricao = ranking.length === 0
        ? "Nenhum piloto no ranking ainda."
        : ranking.map((piloto, index) => {
            let posicao = `#${index + 1}`;

            if (index === 0) posicao = "🥇";
            if (index === 1) posicao = "🥈";
            if (index === 2) posicao = "🥉";

            return `${posicao} **${piloto.nomeAtual || piloto.nome}**\n` +
                `> MMR: **${piloto.mmr}** • WR: **${piloto.winrate}%** • Corridas: **${piloto.corridas}**`;
        }).join("\n\n");

    const embed = new EmbedBuilder()
        .setColor("#FF61AD")
        .setTitle("🏆 Ranking Geral | Top 16")
        .setDescription(descricao)
        .setFooter({
            text: "Use /rankingmmr para ver o ranking completo"
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
    calcularRankingMMR,
    carregarRankingMMR,
    atualizarRankingMMRDiscord,
    buscarGanhosMMRDaCorrida
};