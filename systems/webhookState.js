const {
    carregarJSON,
    salvarJSON
} = require("../utils/json");

function carregarWebhookState() {
    return carregarJSON("webhook_state.json");
}

function salvarWebhookState(state) {
    salvarJSON("webhook_state.json", state);
}

module.exports = {
    carregarWebhookState,
    salvarWebhookState
};