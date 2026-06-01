require("dotenv").config();

const fs = require("fs");

const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

function carregarPistas() {
    if (!fs.existsSync("pistas.json")) {
        fs.writeFileSync("pistas.json", "[]");
    }

    const data = fs.readFileSync("pistas.json", "utf8");

    if (!data.trim()) {
        fs.writeFileSync("pistas.json", "[]");
        return [];
    }

    return JSON.parse(data);
}

function salvarPistas(pistas) {
    fs.writeFileSync(
        "pistas.json",
        JSON.stringify(pistas, null, 2)
    );
}

async function atualizarMensagemPistas(client) {
    if (!process.env.PISTAS_CHANNEL_ID) {
        console.log("Erro: PISTAS_CHANNEL_ID não foi definido no .env");
        return;
    }

    const channel = await client.channels.fetch(
        process.env.PISTAS_CHANNEL_ID
    );

    const pistas = carregarPistas();

    let descricao = "";

    if (pistas.length === 0) {
        descricao =
            "Nenhuma pista cadastrada.\nUse /addpista para adicionar uma pista.";
    } else {
        const colunas = [];

        for (let i = 0; i < 5; i++) {
            const inicio = i * 10;
            const fim = inicio + 10;

            const grupo = pistas.slice(inicio, fim);

            const texto = grupo.length > 0
                ? grupo
                    .map(
                        (pista, index) =>
                            `**${inicio + index + 1}.** ${pista}`
                    )
                    .join("\n")
                : "";

            colunas.push(texto);
        }

        descricao = colunas
            .filter(coluna => coluna.trim() !== "")
            .join("\n\n");
    }

    const embed = new EmbedBuilder()
        .setColor("#FF61AD")
        .setTitle("🏁 PISTAS OFICIAIS")
        .setDescription(descricao)
        .setFooter({
            text: `Total de pistas: ${pistas.length}`
        })
        .setTimestamp();

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

async function atualizarRanking(client) {
    if (!process.env.RANKING_CHANNEL_ID) {
        console.log("Erro: RANKING_CHANNEL_ID não definido.");
        return;
    }

    const channel = await client.channels.fetch(
        process.env.RANKING_CHANNEL_ID
    );

    let ranking = carregarRanking();

    ranking = ranking.sort((a, b) => {
        if (b.pontos !== a.pontos) {
            return b.pontos - a.pontos;
        }

        return a.melhorColocacao - b.melhorColocacao;
    });

    let descricao = "";

    if (ranking.length === 0) {
        descricao = "Nenhum resultado registrado ainda.";
    } else {
        descricao = ranking
            .map((piloto, index) => {
                let posicao = `#${index + 1}`;

                if (index === 0) posicao = "🥇";
                if (index === 1) posicao = "🥈";
                if (index === 2) posicao = "🥉";

                return `${posicao} **ID ${piloto.id}**\n` +
                    `> **${piloto.pontos} pts** • Melhor: **${piloto.melhorColocacao}º** • Corridas: **${piloto.corridas}**`;
            })
            .join("\n\n");
    }

    const embed = new EmbedBuilder()
        .setColor("#FF61AD")
        .setTitle("🏆 Ranking Oficial")
        .setDescription(descricao)
        .setFooter({
            text: "Atualizado automaticamente após cada corrida"
        })
        .setTimestamp();

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

function carregarRanking() {
    if (!fs.existsSync("ranking.json")) {
        fs.writeFileSync("ranking.json", "[]");
    }

    const data = fs.readFileSync("ranking.json", "utf8");

    if (!data.trim()) {
        fs.writeFileSync("ranking.json", "[]");
        return [];
    }

    return JSON.parse(data);
}

function salvarRanking(ranking) {
    fs.writeFileSync(
        "ranking.json",
        JSON.stringify(ranking, null, 2)
    );
}

async function atualizarHallOfFame(client) {

    if (!process.env.HALL_OF_FAME_CHANNEL_ID) {
        console.log("Erro: HALL_OF_FAME_CHANNEL_ID não definido.");
        return;
    }

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
        )
        .setTimestamp();

    for (let i = 0; i < top3.length; i++) {

        const piloto = top3[i];

        let membro = null;

        try {
            if (piloto.discordId) {
                membro = await channel.guild.members.fetch(piloto.discordId);
            }
        } catch { }

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
                `📈 Pontos: **${piloto.pontos}**`,
            inline: false
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

function carregarDuplas() {
    if (!fs.existsSync("duplas.json")) {
        fs.writeFileSync("duplas.json", "[]");
    }

    const data = fs.readFileSync("duplas.json", "utf8");

    if (!data.trim()) {
        fs.writeFileSync("duplas.json", "[]");
        return [];
    }

    return JSON.parse(data);
}

function salvarDuplas(duplas) {
    fs.writeFileSync(
        "duplas.json",
        JSON.stringify(duplas, null, 2)
    );
}

async function atualizarPainelDuplas(client) {
    if (!process.env.DUPLAS_CHANNEL_ID) {
        console.log("Erro: DUPLAS_CHANNEL_ID não definido.");
        return;
    }

    const channel = await client.channels.fetch(
        process.env.DUPLAS_CHANNEL_ID
    );

    const embed = new EmbedBuilder()
        .setColor("#FF61AD")
        .setTitle("🏁 Cadastro de Duplas")
        .setDescription(
            "Clique no botão abaixo para cadastrar sua dupla.\n\n" +
            "• Nome da dupla\n" +
            "• ID do integrante 1\n" +
            "• ID do integrante 2"
        )
        .setFooter({
            text: "Sistema de duplas Rise"
        })
        .setTimestamp();

    const botao = new ButtonBuilder()
        .setCustomId("abrir_cadastro_dupla")
        .setLabel("Cadastrar Dupla")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🏁");

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

    if (!process.env.RANKING_DUPLAS_CHANNEL_ID) {
        console.log("Erro: RANKING_DUPLAS_CHANNEL_ID não definido.");
        return;
    }

    const channel = await client.channels.fetch(
        process.env.RANKING_DUPLAS_CHANNEL_ID
    );

    const duplas = carregarDuplas();
    const rankingIndividual = carregarRanking();

    const rankingDuplas = duplas.map(dupla => {

        const pontos = dupla.integrantes.reduce(
            (total, id) => {

                const piloto = rankingIndividual.find(
                    p => String(p.id) === String(id)
                );

                return total + (piloto ? piloto.pontos : 0);

            }, 0
        );

        return {
            nome: dupla.nome,
            integrantes: dupla.integrantes,
            pontos
        };
    });

    rankingDuplas.sort((a, b) => b.pontos - a.pontos);

    let descricao = "";

    if (rankingDuplas.length === 0) {

        descricao = "Nenhuma dupla cadastrada.";

    } else {

        descricao = rankingDuplas.map((dupla, index) => {

            let posicao = `#${index + 1}`;

            if (index === 0) posicao = "🥇";
            if (index === 1) posicao = "🥈";
            if (index === 2) posicao = "🥉";

            return `${posicao} **${dupla.nome}**\n` +
                `> **${dupla.pontos} pts** • IDs: ${dupla.integrantes.join(" / ")}`;

        }).join("\n\n");
    }

    const embed = new EmbedBuilder()
        .setColor("#FF61AD")
        .setTitle("🏆 Ranking de Duplas")
        .setDescription(descricao)
        .setFooter({
            text: "Pontuação baseada nos integrantes"
        })
        .setTimestamp();

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

function carregarHistorico() {
    if (!fs.existsSync("historico.json")) {
        fs.writeFileSync("historico.json", "[]");
    }

    const data = fs.readFileSync("historico.json", "utf8");

    if (!data.trim()) {
        fs.writeFileSync("historico.json", "[]");
        return [];
    }

    return JSON.parse(data);
}

function salvarHistorico(historico) {
    fs.writeFileSync(
        "historico.json",
        JSON.stringify(historico, null, 2)
    );
}

const commands = [
    new SlashCommandBuilder()
        .setName("addpista")
        .setDescription("Adiciona uma pista")
        .addStringOption(option =>
            option
                .setName("nome")
                .setDescription("Nome da pista")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("removerpista")
        .setDescription("Remove uma pista cadastrada")
        .addIntegerOption(option =>
            option
                .setName("numero")
                .setDescription("Número da pista que deseja remover")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("pistas")
        .setDescription("Mostra todas as pistas"),

    new SlashCommandBuilder()
        .setName("sortear")
        .setDescription("Sorteia 5 pistas"),

    new SlashCommandBuilder()
        .setName("top8")
        .setDescription("Registra o Top 8 da corrida")
        .addIntegerOption(option =>
            option.setName("primeiro").setDescription("ID do 1º lugar").setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("segundo").setDescription("ID do 2º lugar").setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("terceiro").setDescription("ID do 3º lugar").setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("quarto").setDescription("ID do 4º lugar").setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("quinto").setDescription("ID do 5º lugar").setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("sexto").setDescription("ID do 6º lugar").setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("setimo").setDescription("ID do 7º lugar").setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("oitavo").setDescription("ID do 8º lugar").setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("ranking")
        .setDescription("Mostra o ranking geral dos pilotos"),

    new SlashCommandBuilder()
        .setName("removerdupla")
        .setDescription("Remove uma dupla")
        .addStringOption(option =>
            option
                .setName("nome")
                .setDescription("Nome da dupla")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("editardupla")
        .setDescription("Edita uma dupla")
        .addStringOption(option =>
            option
                .setName("nome")
                .setDescription("Nome da dupla")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("novonome")
                .setDescription("Novo nome da dupla")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("id1")
                .setDescription("Novo ID 1")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("id2")
                .setDescription("Novo ID 2")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("listarduplas")
        .setDescription("Lista todas as duplas"),

    new SlashCommandBuilder()
        .setName("historico")
        .setDescription("Mostra o histórico das corridas"),

    new SlashCommandBuilder()
        .setName("corrida")
        .setDescription("Mostra detalhes de uma corrida")
        .addIntegerOption(option =>
            option
                .setName("numero")
                .setDescription("Número da corrida")
                .setRequired(true)
        ),
].map(command => command.toJSON());

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

client.once("ready", () => {
    console.log(`Bot online como ${client.user.tag}`);

    atualizarRanking(client).catch(console.log);
    atualizarHallOfFame(client).catch(console.log);
    atualizarPainelDuplas(client).catch(console.log);
    atualizarMensagemPistas(client).catch(console.log);
});

client.on("interactionCreate", async interaction => {

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

        await interaction.reply({
            embeds: [embed]
        });
    }

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

        await interaction.reply({
            embeds: [embed]
        });
    }

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

            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {

        if (interaction.customId === "form_cadastro_dupla") {

            const nomeDupla =
                interaction.fields.getTextInputValue("nome_dupla");

            const id1 =
                interaction.fields.getTextInputValue("id_1");

            const id2 =
                interaction.fields.getTextInputValue("id_2");

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
                dupla =>
                    dupla.nome.toLowerCase() ===
                    nomeDupla.toLowerCase()
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
                    content:
                        "❌ Um desses jogadores já está em outra dupla.",
                    ephemeral: true
                });
            }

            duplas.push({
                nome: nomeDupla,
                integrantes: [id1, id2]
            });

            salvarDuplas(duplas);

            const embed = new EmbedBuilder()
                .setColor("#FF61AD")
                .setTitle("✅ Dupla cadastrada")
                .setDescription(
                    `🏁 **${nomeDupla}**\n\n` +
                    `👤 ID 1: **${id1}**\n` +
                    `👤 ID 2: **${id2}**`
                )
                .setFooter({
                    text: "Sistema de duplas Rise"
                })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
    }

    if (!interaction.isChatInputCommand()) return;

    // REMOVER DUPLA
    if (interaction.commandName === "removerdupla") {

        const nome = interaction.options
            .getString("nome");

        let duplas = carregarDuplas();

        const index = duplas.findIndex(
            dupla =>
                dupla.nome.toLowerCase() ===
                nome.toLowerCase()
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

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#FF61AD")
                    .setTitle("🗑️ Dupla removida")
                    .setDescription(
                        `🏁 **${duplaRemovida.nome}**`
                    )
            ]
        });
    }

    // EDITAR DUPLA
    if (interaction.commandName === "editardupla") {

        const nome =
            interaction.options.getString("nome");

        const novoNome =
            interaction.options.getString("novonome");

        const id1 =
            interaction.options.getString("id1");

        const id2 =
            interaction.options.getString("id2");

        if (id1 === id2) {
            return interaction.reply({
                content: "❌ Os IDs não podem ser iguais.",
                ephemeral: true
            });
        }

        let duplas = carregarDuplas();

        const dupla = duplas.find(
            d =>
                d.nome.toLowerCase() ===
                nome.toLowerCase()
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
                content:
                    "❌ Um desses IDs já pertence a outra dupla.",
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

        await interaction.reply({
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

        await interaction.reply({
            embeds: [embed]
        });
    }

    let pistas = carregarPistas();

    // ADD PISTA
    if (interaction.commandName === "addpista") {
        const nome = interaction.options.getString("nome");

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

        await interaction.reply(
            `🏁 Pista adicionada com sucesso:\n**${nome}**`
        );
    }

    // REMOVER PISTA
    if (interaction.commandName === "removerpista") {
        const numero = interaction.options.getInteger("numero");

        const index = numero - 1;

        if (pistas.length === 0) {
            return interaction.reply(
                "❌ Nenhuma pista cadastrada."
            );
        }

        if (index < 0 || index >= pistas.length) {
            return interaction.reply(
                `❌ Número inválido. Escolha um número entre 1 e ${pistas.length}.`
            );
        }

        const pistaRemovida = pistas.splice(index, 1)[0];

        salvarPistas(pistas);

        await atualizarMensagemPistas(client);

        await interaction.reply(
            `🗑️ Pista removida com sucesso:\n**${pistaRemovida}**`
        );
    }

    // LISTAR PISTAS
    if (interaction.commandName === "pistas") {
        if (pistas.length === 0) {
            return interaction.reply(
                "❌ Nenhuma pista cadastrada."
            );
        }

        await interaction.reply(
            `🏎️ Pistas cadastradas:\n\n${pistas
                .map(
                    (pista, index) =>
                        `**${index + 1}.** ${pista}`
                )
                .join("\n")}`
        );
    }

    // SORTEAR
    if (interaction.commandName === "sortear") {
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
            .setDescription(
                "As pistas sorteadas para a corrida foram:"
            )
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

        await interaction.reply({
            embeds: [embed]
        });
    }

    // REGISTRAR TOP 8
    // REGISTRAR TOP 8
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

            const idsDuplicados = ids.filter((id, index) => ids.indexOf(id) !== index);

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

            setTimeout(() => {
                atualizarRanking(client).catch(console.log);
                atualizarHallOfFame(client).catch(console.log);
                atualizarRankingDuplas(client).catch(console.log);
            }, 1000);

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

        } catch (error) {
            console.log(error);

            await interaction.editReply(
                "❌ Ocorreu um erro ao registrar o Top 8. Veja o terminal para detalhes."
            );
        }
    }

    // MOSTRAR RANKING
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

        await interaction.reply({
            embeds: [embed]
        });
    }
});

registrarComandos();

client.on("messageCreate", async message => {
    if (message.author.bot) return;

    // CANAL DE CADASTRO
    if (message.channel.id !== process.env.CADASTRO_CHANNEL_ID) return;

    const args = message.content.split(" ");

    if (args.length < 2) {
        return message.reply(
            "❌ Formato inválido.\nUse: Nome ID"
        );
    }

    const id = args[args.length - 1];

    const nome = args.slice(0, -1).join(" ");

    // VALIDAR ID
    if (isNaN(id)) {
        return message.reply(
            "❌ O ID precisa ser um número."
        );
    }

    try {
        // ALTERAR NICKNAME
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

        // ADICIONAR CARGO
        const role = message.guild.roles.cache.get(
            process.env.CIDADAO_ROLE_ID
        );

        if (role) {
            await message.member.roles.add(role);
        }

        const embed = new EmbedBuilder()
            .setColor("#FF61AD")
            .setTitle("✅ Cadastro realizado")
            .setDescription(
                `👤 Nome: **${nome}**\n🆔 ID: **${id}**`
            )
            .setFooter({
                text: "Bem-vindo à Rise"
            })
            .setTimestamp();

        await message.delete();

        const resposta = await message.channel.send({
            content: `${message.author}`,
            embeds: [embed]
        });

        // APAGA A RESPOSTA APÓS 5 SEGUNDOS
        setTimeout(async () => {
            try {
                await resposta.delete();
            } catch { }
        }, 5000);

    } catch (error) {
        console.log(error);

        message.reply(
            "❌ Não consegui concluir seu cadastro."
        );
    }
});

client.login(process.env.TOKEN);