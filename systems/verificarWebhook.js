const {
    carregarWebhookState,
    salvarWebhookState
} = require("./webhookState");

async function verificarMensagensPendentes(client) {

    const state = carregarWebhookState();

    const channel = await client.channels.fetch(
        process.env.RESULTADOS_CHANNEL_ID
    );

    const mensagens = await channel.messages.fetch({
        limit: 100
    });

    const mensagensOrdenadas = [...mensagens.values()]
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    let novasMensagens = [];

    for (const mensagem of mensagensOrdenadas) {

        if (!mensagem.webhookId) continue;

        if (
            !state.ultimaMensagemId ||
            mensagem.id > state.ultimaMensagemId
        ) {
            novasMensagens.push(mensagem);
        }
    }

    console.log(
        `${novasMensagens.length} corridas pendentes encontradas`
    );

    for (const mensagem of novasMensagens) {

        client.emit("messageCreate", mensagem);

        salvarWebhookState({
            ultimaMensagemId: mensagem.id
        });
    }
}

module.exports = {
    verificarMensagensPendentes
};