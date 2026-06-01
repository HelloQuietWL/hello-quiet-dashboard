const {
    SlashCommandBuilder
} = require("discord.js");

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
        .addIntegerOption(option => option.setName("primeiro").setDescription("ID do 1º lugar").setRequired(true))
        .addIntegerOption(option => option.setName("segundo").setDescription("ID do 2º lugar").setRequired(true))
        .addIntegerOption(option => option.setName("terceiro").setDescription("ID do 3º lugar").setRequired(true))
        .addIntegerOption(option => option.setName("quarto").setDescription("ID do 4º lugar").setRequired(true))
        .addIntegerOption(option => option.setName("quinto").setDescription("ID do 5º lugar").setRequired(true))
        .addIntegerOption(option => option.setName("sexto").setDescription("ID do 6º lugar").setRequired(true))
        .addIntegerOption(option => option.setName("setimo").setDescription("ID do 7º lugar").setRequired(true))
        .addIntegerOption(option => option.setName("oitavo").setDescription("ID do 8º lugar").setRequired(true)),

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
        .addStringOption(option => option.setName("nome").setDescription("Nome da dupla").setRequired(true))
        .addStringOption(option => option.setName("novonome").setDescription("Novo nome da dupla").setRequired(true))
        .addStringOption(option => option.setName("id1").setDescription("Novo ID 1").setRequired(true))
        .addStringOption(option => option.setName("id2").setDescription("Novo ID 2").setRequired(true)),

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

    new SlashCommandBuilder()
        .setName("rankingmmr")
        .setDescription("Mostra o ranking MMR completo"),

    new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Mostra o perfil competitivo de um piloto")
    .addIntegerOption(option =>
        option
            .setName("id")
            .setDescription("ID do piloto")
            .setRequired(true)
    ),

    new SlashCommandBuilder()
    .setName("h2h")
    .setDescription("Compara dois pilotos")
    .addIntegerOption(option =>
        option
            .setName("id1")
            .setDescription("Primeiro piloto")
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option
            .setName("id2")
            .setDescription("Segundo piloto")
            .setRequired(true)
    ),

    new SlashCommandBuilder()
    .setName("stats-pista")
    .setDescription("Mostra o desempenho de um piloto em uma pista")
    .addIntegerOption(option =>
        option
            .setName("id")
            .setDescription("ID do piloto")
            .setRequired(true)
    )
    .addStringOption(option =>
        option
            .setName("pista")
            .setDescription("Nome da pista")
            .setRequired(true)
    ),

    new SlashCommandBuilder()
    .setName("previsao")
    .setDescription("Calcula favorito e ODD entre dois pilotos")
    .addIntegerOption(option =>
        option
            .setName("id1")
            .setDescription("ID do primeiro piloto")
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option
            .setName("id2")
            .setDescription("ID do segundo piloto")
            .setRequired(true)
    )
    .addStringOption(option =>
        option
            .setName("pista")
            .setDescription("Nome da pista")
            .setRequired(true)
    ),
    
].map(command => command.toJSON());

module.exports = commands;