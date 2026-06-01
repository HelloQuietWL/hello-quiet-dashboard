const fs = require("fs");
const path = require("path");

function carregarJSON(nomeArquivo) {
    const caminho = path.join(__dirname, "..", "data", nomeArquivo);

    if (!fs.existsSync(caminho)) {
        fs.writeFileSync(caminho, "[]");
    }

    const data = fs.readFileSync(caminho, "utf8");

    if (!data.trim()) {
        fs.writeFileSync(caminho, "[]");
        return [];
    }

    return JSON.parse(data);
}

function salvarJSON(nomeArquivo, dados) {
    const caminho = path.join(__dirname, "..", "data", nomeArquivo);

    fs.writeFileSync(
        caminho,
        JSON.stringify(dados, null, 2)
    );
}

module.exports = {
    carregarJSON,
    salvarJSON
};