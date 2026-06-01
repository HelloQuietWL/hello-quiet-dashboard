const { carregarJSON, salvarJSON } = require("../utils/json");

function carregarHistorico() {
    return carregarJSON("historico.json");
}

function salvarHistorico(historico) {
    salvarJSON("historico.json", historico);
}

module.exports = {
    carregarHistorico,
    salvarHistorico
};