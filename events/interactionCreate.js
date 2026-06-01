const {
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require("discord.js");

const {
    carregarPistas,
    salvarPistas,
    atualizarMensagemPistas
} = require("../systems/pistas");

const {
    carregarRanking,
    salvarRanking,
    atualizarRanking
} = require("../systems/ranking");

const {
    atualizarHallOfFame
} = require("../systems/hallOfFame");

const {
    carregarDuplas,
    salvarDuplas,
    atualizarRankingDuplas
} = require("../systems/duplas");

const {
    carregarHistorico,
    salvarHistorico
} = require("../systems/historico");

const {
    carregarRankingMMR
} = require("../systems/mmr");

const {
    carregarCorridas
} = require("../systems/corridas");


function temCargoOrganizador(interaction) {
    return interaction.member.roles.cache.has(
        process.env.ORGANIZADOR_ROLE_ID
    );
}

function comandoProtegido(nomeComando) {
    return [
        "addpista",
        "removerpista",
        "top8",
        "removerdupla",
        "editardupla"
    ].includes(nomeComando);
}

function tempoParaMsLocal(tempo) {
    if (!tempo || typeof tempo !== "string") return 0;

    const partes = tempo.split(":");

    if (partes.length === 2) {
        const minutos = Number(partes[0]);
        const segundos = Number(partes[1]);
        return (minutos * 60 + segundos) * 1000;
    }

    return 0;
}

module.exports = async interaction => {

    // BOTÃO CADASTRAR DUPLA
    if (interaction.isButton()) {
        if (interaction.customId === "abrir_cadastro_dupla") {

            const modal = new ModalBuilder()
                .setCustomId("form_cadastro_dupla")
                .setTitle("Cadastro de Dupla");

            const nomeDupla = new TextInputBuilder()
                .setCustomId("nome_dupla")
                .setLabel("Nome da dupla")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const id1 = new TextInputBuilder()
                .setCustomId("id_1")
                .setLabel("ID do integrante 1")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const id2 = new TextInputBuilder()
                .setCustomId("id_2")
                .setLabel("ID do integrante 2")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nomeDupla),
                new ActionRowBuilder().addComponents(id1),
                new ActionRowBuilder().addComponents(id2)
            );

            return interaction.showModal(modal);
        }
    }

    // FORMULÁRIO DE DUPLA
    if (interaction.isModalSubmit()) {
        if (interaction.customId === "form_cadastro_dupla") {

            const nomeDupla = interaction.fields.getTextInputValue("nome_dupla");
            const id1 = interaction.fields.getTextInputValue("id_1");
            const id2 = interaction.fields.getTextInputValue("id_2");

            if (isNaN(id1) || isNaN(id2)) {
                return interaction.reply({
                    content: "❌ Os IDs precisam ser números.",
                    ephemeral: true
                });
            }

            if (id1 === id2) {
                return interaction.reply({
                    content: "❌ Os IDs não podem ser iguais.",
                    ephemeral: true
                });
            }

            let duplas = carregarDuplas();

            const duplaExiste = duplas.some(
                dupla => dupla.nome.toLowerCase() === nomeDupla.toLowerCase()
            );

            if (duplaExiste) {
                return interaction.reply({
                    content: "❌ Já existe uma dupla com esse nome.",
                    ephemeral: true
                });
            }

            const jogadorJaExiste = duplas.some(
                dupla =>
                    dupla.integrantes.includes(id1) ||
                    dupla.integrantes.includes(id2)
            );

            if (jogadorJaExiste) {
                return interaction.reply({
                    content: "❌ Um desses jogadores já está em outra dupla.",
                    ephemeral: true
                });
            }

            duplas.push({
                nome: nomeDupla,
                integrantes: [id1, id2]
            });

            salvarDuplas(duplas);

            atualizarRankingDuplas(interaction.client).catch(console.log);

            const embed = new EmbedBuilder()
                .setColor("#FF61AD")
                .setTitle("✅ Dupla cadastrada")
                .setDescription(
                    `🏁 **${nomeDupla}**\n\n` +
                    `👤 ID 1: **${id1}**\n` +
                    `👤 ID 2: **${id2}**`
                )
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
    }

    if (!interaction.isChatInputCommand()) return;

    if (
        comandoProtegido(interaction.commandName) &&
        !temCargoOrganizador(interaction)
    ) {
        return interaction.reply({
            content: "❌ Você não tem permissão para usar esse comando.",
            ephemeral: true
        });
    }

    const client = interaction.client;

    // HISTÓRICO
    if (interaction.commandName === "historico") {
        const historico = carregarHistorico();

        if (historico.length === 0) {
            return interaction.reply("❌ Nenhuma corrida registrada ainda.");
        }

        const ultimasCorridas = historico.slice(-10).reverse();

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle("📜 Histórico de Corridas")
            .setDescription(
                ultimasCorridas.map(corrida => {
                    return `**Corrida #${corrida.numero}**\n` +
                        `> ${corrida.data}\n` +
                        `> 🥇 ID ${corrida.resultado[0].id} • ` +
                        `🥈 ID ${corrida.resultado[1].id} • ` +
                        `🥉 ID ${corrida.resultado[2].id}`;
                }).join("\n\n")
            )
            .setFooter({
                text: "Mostrando as últimas 10 corridas"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // DETALHES DE UMA CORRIDA
    if (interaction.commandName === "corrida") {
        const numero = interaction.options.getInteger("numero");
        const historico = carregarHistorico();

        const corrida = historico.find(c => c.numero === numero);

        if (!corrida) {
            return interaction.reply("❌ Corrida não encontrada.");
        }

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle(`🏁 Corrida #${corrida.numero}`)
            .setDescription(
                `📅 **Data:** ${corrida.data}\n\n` +
                corrida.resultado.map(item => {
                    return `**${item.posicao}º** - ID **${item.id}** | +${item.pontos} pts`;
                }).join("\n")
            )
            .setFooter({
                text: "Detalhes da corrida"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // ADD PISTA
    if (interaction.commandName === "addpista") {
        const nome = interaction.options.getString("nome");

        let pistas = carregarPistas();

        const pistaExiste = pistas.some(
            pista => pista.toLowerCase() === nome.toLowerCase()
        );

        if (pistaExiste) {
            return interaction.reply(
                `❌ Essa pista já está cadastrada:\n**${nome}**`
            );
        }

        pistas.push(nome);

        salvarPistas(pistas);

        await atualizarMensagemPistas(client);

        return interaction.reply(
            `🏁 Pista adicionada com sucesso:\n**${nome}**`
        );
    }

    // REMOVER PISTA
    if (interaction.commandName === "removerpista") {
        const numero = interaction.options.getInteger("numero");
        const index = numero - 1;

        let pistas = carregarPistas();

        if (pistas.length === 0) {
            return interaction.reply("❌ Nenhuma pista cadastrada.");
        }

        if (index < 0 || index >= pistas.length) {
            return interaction.reply(
                `❌ Número inválido. Escolha um número entre 1 e ${pistas.length}.`
            );
        }

        const pistaRemovida = pistas.splice(index, 1)[0];

        salvarPistas(pistas);

        await atualizarMensagemPistas(client);

        return interaction.reply(
            `🗑️ Pista removida com sucesso:\n**${pistaRemovida}**`
        );
    }

    // LISTAR PISTAS
    if (interaction.commandName === "pistas") {
        const pistas = carregarPistas();

        if (pistas.length === 0) {
            return interaction.reply("❌ Nenhuma pista cadastrada.");
        }

        return interaction.reply(
            `🏎️ Pistas cadastradas:\n\n${pistas
                .map((pista, index) => `**${index + 1}.** ${pista}`)
                .join("\n")}`
        );
    }

    // SORTEAR PISTAS
    if (interaction.commandName === "sortear") {
        const pistas = carregarPistas();

        if (pistas.length < 5) {
            return interaction.reply(
                "❌ Você precisa ter pelo menos 5 pistas cadastradas."
            );
        }

        const sorteadas = [...pistas]
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle("🏁 HELLO QUIET RACING")
            .setDescription("As pistas sorteadas para a corrida foram:")
            .addFields(
                sorteadas.map((pista, index) => ({
                    name: `#${index + 1} • ${pista}`,
                    value: "Boa sorte aos pilotos!",
                    inline: false
                }))
            )
            .setFooter({
                text: "Sistema de sorteio de pistas"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // REMOVER DUPLA
    if (interaction.commandName === "removerdupla") {
        const nome = interaction.options.getString("nome");

        let duplas = carregarDuplas();

        const index = duplas.findIndex(
            dupla => dupla.nome.toLowerCase() === nome.toLowerCase()
        );

        if (index === -1) {
            return interaction.reply({
                content: "❌ Dupla não encontrada.",
                ephemeral: true
            });
        }

        const duplaRemovida = duplas[index];

        duplas.splice(index, 1);

        salvarDuplas(duplas);

        await atualizarRankingDuplas(client);

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle("🗑️ Dupla removida")
            .setDescription(`🏁 **${duplaRemovida.nome}**`);

        return interaction.reply({
            embeds: [embed]
        });
    }

    // EDITAR DUPLA
    if (interaction.commandName === "editardupla") {
        const nome = interaction.options.getString("nome");
        const novoNome = interaction.options.getString("novonome");
        const id1 = interaction.options.getString("id1");
        const id2 = interaction.options.getString("id2");

        if (id1 === id2) {
            return interaction.reply({
                content: "❌ Os IDs não podem ser iguais.",
                ephemeral: true
            });
        }

        let duplas = carregarDuplas();

        const dupla = duplas.find(
            d => d.nome.toLowerCase() === nome.toLowerCase()
        );

        if (!dupla) {
            return interaction.reply({
                content: "❌ Dupla não encontrada.",
                ephemeral: true
            });
        }

        const conflito = duplas.some(d => {
            if (d.nome === dupla.nome) return false;

            return (
                d.integrantes.includes(id1) ||
                d.integrantes.includes(id2)
            );
        });

        if (conflito) {
            return interaction.reply({
                content: "❌ Um desses IDs já pertence a outra dupla.",
                ephemeral: true
            });
        }

        dupla.nome = novoNome;
        dupla.integrantes = [id1, id2];

        salvarDuplas(duplas);

        await atualizarRankingDuplas(client);

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle("✏️ Dupla editada")
            .setDescription(
                `🏁 **${novoNome}**\n\n` +
                `👤 ID 1: **${id1}**\n` +
                `👤 ID 2: **${id2}**`
            );

        return interaction.reply({
            embeds: [embed]
        });
    }

    // LISTAR DUPLAS
    if (interaction.commandName === "listarduplas") {
        const duplas = carregarDuplas();

        if (duplas.length === 0) {
            return interaction.reply({
                content: "❌ Nenhuma dupla cadastrada."
            });
        }

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle("🏁 Duplas Cadastradas")
            .setDescription(
                duplas.map((dupla, index) => {
                    return `**${index + 1}. ${dupla.nome}**\n` +
                        `> IDs: ${dupla.integrantes.join(" / ")}`;
                }).join("\n\n")
            )
            .setFooter({
                text: `Total de duplas: ${duplas.length}`
            });

        return interaction.reply({
            embeds: [embed]
        });
    }

    // TOP 8
    if (interaction.commandName === "top8") {
        await interaction.deferReply();

        try {
            const pontosPorPosicao = [10, 8, 6, 5, 4, 3, 2, 1];

            const ids = [
                interaction.options.getInteger("primeiro"),
                interaction.options.getInteger("segundo"),
                interaction.options.getInteger("terceiro"),
                interaction.options.getInteger("quarto"),
                interaction.options.getInteger("quinto"),
                interaction.options.getInteger("sexto"),
                interaction.options.getInteger("setimo"),
                interaction.options.getInteger("oitavo")
            ];

            const idsDuplicados = ids.filter(
                (id, index) => ids.indexOf(id) !== index
            );

            if (idsDuplicados.length > 0) {
                return interaction.editReply(
                    "❌ Existem IDs repetidos no Top 8. Verifique e tente novamente."
                );
            }

            let ranking = carregarRanking();

            ids.forEach((id, index) => {
                const posicao = index + 1;
                const pontos = pontosPorPosicao[index];

                let piloto = ranking.find(p => p.id === id);

                if (!piloto) {
                    piloto = {
                        id: id,
                        discordId: null,
                        pontos: 0,
                        corridas: 0,
                        vitorias: 0,
                        melhorColocacao: posicao
                    };

                    ranking.push(piloto);
                }

                piloto.pontos += pontos;
                piloto.corridas += 1;

                if (posicao === 1) {
                    piloto.vitorias += 1;
                }

                if (posicao < piloto.melhorColocacao) {
                    piloto.melhorColocacao = posicao;
                }
            });

            salvarRanking(ranking);

            const historico = carregarHistorico();

            historico.push({
                numero: historico.length + 1,
                data: new Date().toLocaleString("pt-BR"),
                resultado: ids.map((id, index) => ({
                    posicao: index + 1,
                    id: id,
                    pontos: pontosPorPosicao[index]
                }))
            });

            salvarHistorico(historico);

            const embed = new EmbedBuilder()
                .setColor("#FF61AD")
                .setTitle("🏁 Resultado registrado")
                .setDescription(
                    ids.map((id, index) => {
                        return `**${index + 1}º** - ID **${id}** | +${pontosPorPosicao[index]} pts`;
                    }).join("\n")
                )
                .setFooter({
                    text: "Ranking atualizado automaticamente"
                })
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });

            setTimeout(() => {
                atualizarRanking(client).catch(console.log);
                atualizarHallOfFame(client).catch(console.log);
                atualizarRankingDuplas(client).catch(console.log);
            }, 1000);

        } catch (error) {
            console.log(error);

            await interaction.editReply(
                "❌ Ocorreu um erro ao registrar o Top 8. Veja o terminal para detalhes."
            );
        }
    }

    // RANKING
    if (interaction.commandName === "ranking") {
        const ranking = carregarRanking();

        if (ranking.length === 0) {
            return interaction.reply("❌ Nenhum resultado registrado ainda.");
        }

        const rankingOrdenado = ranking.sort((a, b) => {
            if (b.pontos !== a.pontos) {
                return b.pontos - a.pontos;
            }

            return a.melhorColocacao - b.melhorColocacao;
        });

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle("🏆 RANKING GERAL")
            .setDescription(
                rankingOrdenado.map((piloto, index) => {
                    return `**${index + 1}.** ID **${piloto.id}** | ${piloto.pontos} pts | Melhor: ${piloto.melhorColocacao}º | Corridas: ${piloto.corridas}`;
                }).join("\n")
            )
            .setFooter({
                text: "Sistema de pontuação Rise"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    if (interaction.commandName === "rankingmmr") {
        const ranking = carregarRankingMMR();

        if (ranking.length === 0) {
            return interaction.reply("❌ Nenhum piloto no ranking ainda.");
        }

        const texto = ranking.map((piloto, index) => {
            let posicao = `#${index + 1}`;

            if (index === 0) posicao = "🥇";
            if (index === 1) posicao = "🥈";
            if (index === 2) posicao = "🥉";

            return `${posicao} **${piloto.nomeAtual || piloto.nome}**\n` +
                `> MMR: **${piloto.mmr}** • WR: **${piloto.winrate}%** • Corridas: **${piloto.corridas}**`;
        }).join("\n\n");

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle("🏆 Ranking MMR Completo")
            .setDescription(texto.slice(0, 4000))
            .setFooter({
                text: `Total de pilotos: ${ranking.length}`
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // PERFIL DO PILOTO
    if (interaction.commandName === "perfil") {
        const id = interaction.options.getInteger("id");

        const ranking = carregarRankingMMR();

        const piloto = ranking.find(p =>
            String(p.id) === String(id)
        );

        if (!piloto) {
            return interaction.reply({
                content: "❌ Piloto não encontrado no ranking.",
                ephemeral: true
            });
        }

        let melhorPista = "Sem dados";

        if (piloto.desempenhoPorPista) {
            const pistas = Object.entries(piloto.desempenhoPorPista);

            if (pistas.length > 0) {
                pistas.sort((a, b) => {
                    const pistaA = a[1];
                    const pistaB = b[1];

                    if (pistaB.vitorias !== pistaA.vitorias) {
                        return pistaB.vitorias - pistaA.vitorias;
                    }

                    return pistaB.top3 - pistaA.top3;
                });

                melhorPista = `${pistas[0][0]} (${pistas[0][1].vitorias} vitórias)`;
            }
        }

        const ultimasCorridas = piloto.ultimasCorridas && piloto.ultimasCorridas.length > 0
            ? piloto.ultimasCorridas
                .slice()
                .reverse()
                .slice(0, 5)
                .map(corrida => {
                    const sinal = corrida.ganhoMMR >= 0 ? "+" : "";

                    return `**${corrida.posicao}º** em **${corrida.pista}** | ${sinal}${corrida.ganhoMMR} MMR`;
                })
                .join("\n")
            : "Sem corridas recentes.";

        const historicoNomes = piloto.historicoNomes && piloto.historicoNomes.length > 1
            ? piloto.historicoNomes.join(", ")
            : "Sem alterações registradas.";

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle(`🏎️ Perfil de ${piloto.nomeAtual || piloto.nome}`)
            .setDescription(
                `🆔 **ID:** ${piloto.id}\n` +
                `🏆 **MMR:** ${piloto.mmr}\n` +
                `📈 **Winrate:** ${piloto.winrate}%\n` +
                `🥉 **Top 3 Rate:** ${piloto.podiumRate}%`
            )
            .addFields(
                {
                    name: "📊 Estatísticas",
                    value:
                        `Corridas: **${piloto.corridas}**\n` +
                        `Vitórias: **${piloto.vitorias}**\n` +
                        `Top 3: **${piloto.top3}**\n` +
                        `Média de colocação: **${piloto.mediaColocacao}**\n` +
                        `Melhor colocação: **${piloto.melhorColocacao}º**`,
                    inline: false
                },
                {
                    name: "🏁 Melhor pista",
                    value: melhorPista,
                    inline: false
                },
                {
                    name: "🕒 Últimas corridas",
                    value: ultimasCorridas,
                    inline: false
                },
                {
                    name: "📛 Histórico de nomes",
                    value: historicoNomes,
                    inline: false
                }
            )
            .setFooter({
                text: "Perfil competitivo baseado no ranking MMR"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // HEAD TO HEAD
    if (interaction.commandName === "h2h") {

        const id1 = interaction.options.getInteger("id1");
        const id2 = interaction.options.getInteger("id2");

        if (id1 === id2) {
            return interaction.reply({
                content: "❌ Escolha dois IDs diferentes.",
                ephemeral: true
            });
        }

        const ranking = carregarRankingMMR();
        const corridas = carregarCorridas();

        const piloto1 = ranking.find(
            p => String(p.id) === String(id1)
        );

        const piloto2 = ranking.find(
            p => String(p.id) === String(id2)
        );

        if (!piloto1 || !piloto2) {
            return interaction.reply({
                content: "❌ Um dos pilotos não foi encontrado.",
                ephemeral: true
            });
        }

        let vitorias1 = 0;
        let vitorias2 = 0;

        const corridasJuntos = [];

        for (const corrida of corridas) {

            const p1 = corrida.participantes.find(
                p => String(p.id) === String(id1)
            );

            const p2 = corrida.participantes.find(
                p => String(p.id) === String(id2)
            );

            if (!p1 || !p2) continue;

            corridasJuntos.push({
                pista: corrida.pista,
                posicao1: p1.posicao,
                posicao2: p2.posicao
            });

            if (p1.posicao < p2.posicao) {
                vitorias1++;
            } else if (p2.posicao < p1.posicao) {
                vitorias2++;
            }
        }

        const total = corridasJuntos.length;

        if (total === 0) {
            return interaction.reply({
                content: "❌ Esses pilotos nunca correram juntos.",
                ephemeral: true
            });
        }

        const wr1 = ((vitorias1 / total) * 100).toFixed(1);
        const wr2 = ((vitorias2 / total) * 100).toFixed(1);

        const diferencaMMR = Math.abs(
            piloto1.mmr - piloto2.mmr
        ).toFixed(1);

        let favorito = piloto1.nomeAtual;

        if (piloto2.mmr > piloto1.mmr) {
            favorito = piloto2.nomeAtual;
        }

        const ultimas = corridasJuntos
            .slice(-5)
            .reverse()
            .map(corrida => {

                let vencedor = piloto1.nomeAtual;

                if (corrida.posicao2 < corrida.posicao1) {
                    vencedor = piloto2.nomeAtual;
                }

                return `🏁 ${corrida.pista}\n` +
                    `> ${piloto1.nomeAtual}: ${corrida.posicao1}º\n` +
                    `> ${piloto2.nomeAtual}: ${corrida.posicao2}º\n` +
                    `> Vencedor: **${vencedor}**`;

            }).join("\n\n");

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle("⚔️ Head to Head")
            .setDescription(
                `**${piloto1.nomeAtual}** vs **${piloto2.nomeAtual}**`
            )
            .addFields(
                {
                    name: "📊 Confrontos",
                    value:
                        `Total: **${total}**\n` +
                        `${piloto1.nomeAtual}: **${vitorias1}** vitórias (${wr1}%)\n` +
                        `${piloto2.nomeAtual}: **${vitorias2}** vitórias (${wr2}%)`,
                    inline: false
                },
                {
                    name: "🏆 Comparação MMR",
                    value:
                        `${piloto1.nomeAtual}: **${piloto1.mmr}**\n` +
                        `${piloto2.nomeAtual}: **${piloto2.mmr}**\n\n` +
                        `Diferença: **${diferencaMMR}** MMR`,
                    inline: false
                },
                {
                    name: "🔥 Favorito Atual",
                    value: `**${favorito}**`,
                    inline: false
                },
                {
                    name: "🕒 Últimos confrontos",
                    value: ultimas,
                    inline: false
                }
            )
            .setFooter({
                text: "Comparação baseada nas corridas registradas"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // STATS POR PISTA
    if (interaction.commandName === "stats-pista") {
        const id = interaction.options.getInteger("id");
        const pistaBuscada = interaction.options.getString("pista");

        const ranking = carregarRankingMMR();

        const piloto = ranking.find(p =>
            String(p.id) === String(id)
        );

        if (!piloto) {
            return interaction.reply({
                content: "❌ Piloto não encontrado no ranking.",
                ephemeral: true
            });
        }

        if (!piloto.desempenhoPorPista) {
            return interaction.reply({
                content: "❌ Esse piloto ainda não possui dados por pista.",
                ephemeral: true
            });
        }

        const nomePistaEncontrada = Object.keys(piloto.desempenhoPorPista)
            .find(nomePista =>
                nomePista.toLowerCase() === pistaBuscada.toLowerCase()
            );

        if (!nomePistaEncontrada) {
            return interaction.reply({
                content: "❌ Esse piloto ainda não correu nessa pista.",
                ephemeral: true
            });
        }

        const stats = piloto.desempenhoPorPista[nomePistaEncontrada];

        const winratePista = stats.corridas > 0
            ? Number(((stats.vitorias / stats.corridas) * 100).toFixed(2))
            : 0;

        const top3RatePista = stats.corridas > 0
            ? Number(((stats.top3 / stats.corridas) * 100).toFixed(2))
            : 0;

        const tempos = stats.tempos || [];

        const melhorTempo = tempos.length > 0
            ? tempos
                .slice()
                .sort((a, b) => tempoParaMsLocal(a) - tempoParaMsLocal(b))[0]
            : "Sem tempo";

        const ultimosTempos = tempos.length > 0
            ? tempos.slice(-5).reverse().join("\n")
            : "Sem tempos recentes.";

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle(`🏁 Stats por Pista`)
            .setDescription(
                `Piloto: **${piloto.nomeAtual || piloto.nome}**\n` +
                `ID: **${piloto.id}**\n` +
                `Pista: **${nomePistaEncontrada}**`
            )
            .addFields(
                {
                    name: "📊 Desempenho",
                    value:
                        `Corridas: **${stats.corridas}**\n` +
                        `Vitórias: **${stats.vitorias}**\n` +
                        `Top 3: **${stats.top3}**\n` +
                        `Winrate na pista: **${winratePista}%**\n` +
                        `Top 3 Rate: **${top3RatePista}%**\n` +
                        `Melhor colocação: **${stats.melhorColocacao}º**`,
                    inline: false
                },
                {
                    name: "⏱️ Melhor tempo",
                    value: `**${melhorTempo}**`,
                    inline: false
                },
                {
                    name: "🕒 Últimos tempos",
                    value: ultimosTempos,
                    inline: false
                }
            )
            .setFooter({
                text: "Estatísticas baseadas nas corridas registradas"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // PREVISÃO / ODD
    if (interaction.commandName === "previsao") {
        const id1 = interaction.options.getInteger("id1");
        const id2 = interaction.options.getInteger("id2");
        const pistaBuscada = interaction.options.getString("pista");

        if (id1 === id2) {
            return interaction.reply({
                content: "❌ Escolha dois pilotos diferentes.",
                ephemeral: true
            });
        }

        const ranking = carregarRankingMMR();
        const corridas = carregarCorridas();

        const piloto1 = ranking.find(p => String(p.id) === String(id1));
        const piloto2 = ranking.find(p => String(p.id) === String(id2));

        if (!piloto1 || !piloto2) {
            return interaction.reply({
                content: "❌ Um dos pilotos não foi encontrado no ranking.",
                ephemeral: true
            });
        }

        function chancePorMMR(mmrA, mmrB) {
            return 1 / (1 + Math.pow(10, (mmrB - mmrA) / 400));
        }

        function pegarStatsPista(piloto, pista) {
            if (!piloto.desempenhoPorPista) return null;

            const nomePista = Object.keys(piloto.desempenhoPorPista).find(
                p => p.toLowerCase() === pista.toLowerCase()
            );

            if (!nomePista) return null;

            return piloto.desempenhoPorPista[nomePista];
        }

        function formaRecente(piloto) {
            if (!piloto.ultimasCorridas || piloto.ultimasCorridas.length === 0) {
                return 0;
            }

            const ultimas = piloto.ultimasCorridas.slice(-5);
            let score = 0;

            for (const corrida of ultimas) {
                if (corrida.posicao === 1) score += 3;
                else if (corrida.posicao <= 3) score += 2;
                else if (corrida.posicao <= 5) score += 1;
                else score -= 1;
            }

            return score;
        }

        function normalizarForma(valor) {
            return Math.max(
                0,
                Math.min(
                    1,
                    (valor + 5) / 10
                )
            );
        }

        function calcularH2H(idA, idB) {
            let vitoriasA = 0;
            let vitoriasB = 0;
            let total = 0;

            for (const corrida of corridas) {
                const pA = corrida.participantes.find(
                    p => String(p.id) === String(idA)
                );

                const pB = corrida.participantes.find(
                    p => String(p.id) === String(idB)
                );

                if (!pA || !pB) continue;

                total++;

                if (pA.posicao < pB.posicao) vitoriasA++;
                if (pB.posicao < pA.posicao) vitoriasB++;
            }

            return {
                total,
                vitoriasA,
                vitoriasB
            };
        }

        const statsPista1 = pegarStatsPista(piloto1, pistaBuscada);
        const statsPista2 = pegarStatsPista(piloto2, pistaBuscada);

        const h2h = calcularH2H(id1, id2);

        let scoreMMR1 = chancePorMMR(
            piloto1.mmr,
            piloto2.mmr
        );

        let scoreMMR2 = 1 - scoreMMR1;

        let scoreH2H1 = 0.5;
        let scoreH2H2 = 0.5;

        if (h2h.total >= 3) {
            scoreH2H1 = h2h.vitoriasA / h2h.total;
            scoreH2H2 = h2h.vitoriasB / h2h.total;
        }

        let scorePista1 = 0.5;
        let scorePista2 = 0.5;

        if (statsPista1 && statsPista1.corridas >= 3) {
            scorePista1 = statsPista1.vitorias / statsPista1.corridas;
        }

        if (statsPista2 && statsPista2.corridas >= 3) {
            scorePista2 = statsPista2.vitorias / statsPista2.corridas;
        }

        const scoreForma1 = normalizarForma(
            formaRecente(piloto1)
        );

        const scoreForma2 = normalizarForma(
            formaRecente(piloto2)
        );

        const scoreWR1 = (piloto1.winrate || 0) / 100;
        const scoreWR2 = (piloto2.winrate || 0) / 100;

        let chance1 =
            (scoreMMR1 * 0.40) +
            (scoreH2H1 * 0.25) +
            (scorePista1 * 0.15) +
            (scoreForma1 * 0.10) +
            (scoreWR1 * 0.10);

        let chance2 =
            (scoreMMR2 * 0.40) +
            (scoreH2H2 * 0.25) +
            (scorePista2 * 0.15) +
            (scoreForma2 * 0.10) +
            (scoreWR2 * 0.10);

        const soma = chance1 + chance2;

        chance1 = chance1 / soma;
        chance2 = chance2 / soma;

        chance1 = Math.max(0.05, Math.min(0.95, chance1));
        chance2 = Math.max(0.05, Math.min(0.95, chance2));

        const somaFinal = chance1 + chance2;

        chance1 = chance1 / somaFinal;
        chance2 = chance2 / somaFinal;

        const odd1 = Number((1 / chance1).toFixed(2));
        const odd2 = Number((1 / chance2).toFixed(2));

        const porcentagem1 = Number((chance1 * 100).toFixed(1));
        const porcentagem2 = Number((chance2 * 100).toFixed(1));

        const favorito = chance1 > chance2 ? piloto1 : piloto2;

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle("📊 Previsão da Corrida")
            .setDescription(
                `Pista: **${pistaBuscada}**\n\n` +
                `**${piloto1.nomeAtual || piloto1.nome}** vs **${piloto2.nomeAtual || piloto2.nome}**`
            )
            .addFields(
                {
                    name: "🏆 Favorito",
                    value: `**${favorito.nomeAtual || favorito.nome}**`,
                    inline: false
                },
                {
                    name: `${piloto1.nomeAtual || piloto1.nome}`,
                    value:
                        `Chance: **${porcentagem1}%**\n` +
                        `ODD sugerida: **${odd1}**\n` +
                        `MMR: **${piloto1.mmr}**\n` +
                        `Winrate: **${piloto1.winrate}%**`,
                    inline: true
                },
                {
                    name: `${piloto2.nomeAtual || piloto2.nome}`,
                    value:
                        `Chance: **${porcentagem2}%**\n` +
                        `ODD sugerida: **${odd2}**\n` +
                        `MMR: **${piloto2.mmr}**\n` +
                        `Winrate: **${piloto2.winrate}%**`,
                    inline: true
                },
                {
                    name: "⚔️ Head-to-Head",
                    value:
                        h2h.total > 0
                            ? `${piloto1.nomeAtual || piloto1.nome}: **${h2h.vitoriasA}**\n` +
                            `${piloto2.nomeAtual || piloto2.nome}: **${h2h.vitoriasB}**\n` +
                            `Total: **${h2h.total}**`
                            : "Esses pilotos ainda não correram juntos.",
                    inline: false
                },
                {
                    name: "📌 Pesos usados",
                    value:
                        "MMR: **40%**\n" +
                        "H2H: **25%**\n" +
                        "Pista: **15%**\n" +
                        "Forma recente: **10%**\n" +
                        "Winrate: **10%**",
                    inline: false
                }
            )
            .setFooter({
                text: "Previsão baseada em MMR, H2H, pista, forma recente e winrate"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};