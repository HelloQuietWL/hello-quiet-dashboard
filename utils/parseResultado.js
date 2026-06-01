function parseResultadoCorrida(texto) {
    const linhas = texto
        .split("\n")
        .map(linha => linha.trim())
        .filter(linha => linha.length > 0);

    const linhaCorrida = linhas.find(linha => linha.startsWith("Corrida:"));
    const linhaModo = linhas.find(linha => linha.startsWith("Modo:"));

    const corrida = linhaCorrida
        ? linhaCorrida.replace("Corrida:", "").trim()
        : null;

    const modo = linhaModo
        ? linhaModo.replace("Modo:", "").trim()
        : null;

    const participantes = [];

    for (const linha of linhas) {
        const regex = /^(\d+)º\s*·\s*(.+?)\s*·\s*ID\s*(\d+)\s*·\s*([\d:.]+)$/;

        const match = linha.match(regex);

        if (!match) continue;

        participantes.push({
            posicao: Number(match[1]),
            nome: match[2].trim(),
            id: Number(match[3]),
            tempo: match[4].trim()
        });
    }

    return {
        corrida,
        modo,
        participantes
    };
}

module.exports = {
    parseResultadoCorrida
};