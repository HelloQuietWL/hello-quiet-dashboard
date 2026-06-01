
const {
    carregarJSON,
    salvarJSON
} = require("../utils/json");

function carregarCorridas() {
    return carregarJSON("corridas.json");
}

function salvarCorridas(corridas) {
    salvarJSON("corridas.json", corridas);
}

module.exports = {
    carregarCorridas,
    salvarCorridas
};