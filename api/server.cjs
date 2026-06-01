const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());

function carregarJSON(nomeArquivo) {
    const caminho = path.join(__dirname, "..", "data", nomeArquivo);

    if (!fs.existsSync(caminho)) {
        return [];
    }

    const data = fs.readFileSync(caminho, "utf8");

    if (!data.trim()) {
        return [];
    }

    return JSON.parse(data);
}

app.get("/ranking", (req, res) => {
    const ranking = carregarJSON("ranking_mmr.json");
    res.json(ranking);
});

app.get("/piloto/:id", (req, res) => {
    const ranking = carregarJSON("ranking_mmr.json");
    const piloto = ranking.find(p => String(p.id) === String(req.params.id));

    if (!piloto) {
        return res.status(404).json({ error: "Piloto não encontrado" });
    }

    res.json(piloto);
});

app.get("/corridas", (req, res) => {
    const corridas = carregarJSON("corridas.json");
    res.json(corridas);
});

app.get("/duplas", (req, res) => {
    const duplas = carregarJSON("duplas.json");
    res.json(duplas);
});

app.get("/h2h/:id1/:id2", (req, res) => {
    const { id1, id2 } = req.params;

    const ranking = carregarJSON("ranking_mmr.json");

    const piloto1 = ranking.find(
        p => String(p.id) === String(id1)
    );

    const piloto2 = ranking.find(
        p => String(p.id) === String(id2)
    );

    const corridas = carregarJSON("corridas.json");

    let vitorias1 = 0;
    let vitorias2 = 0;
    let total = 0;
    const confrontos = [];

    for (const corrida of corridas) {
        const p1 = corrida.participantes?.find(p => String(p.id) === String(id1));
        const p2 = corrida.participantes?.find(p => String(p.id) === String(id2));

        if (!p1 || !p2) continue;

        total++;

        let vencedor = null;

        if (p1.posicao < p2.posicao) {
            vitorias1++;
            vencedor = id1;
        } else {
            vitorias2++;
            vencedor = id2;
        }

        confrontos.push({
            corrida: corrida.numero,
            pista: corrida.pista,
            id1: {
                posicao: p1.posicao,
                tempo: p1.tempo
            },
            id2: {
                posicao: p2.posicao,
                tempo: p2.tempo
            },
            vencedor
        });
    }

    res.json({
        id1,
        id2,

        nome1:
            piloto1?.nomeAtual ||
            piloto1?.nome ||
            `ID ${id1}`,

        nome2:
            piloto2?.nomeAtual ||
            piloto2?.nome ||
            `ID ${id2}`,

        total,
        vitorias1,
        vitorias2,

        confrontos:
            confrontos.slice(-10).reverse()
    });
});

app.get("/", (req, res) => {
    res.json({
        message: "API Hello Quiet funcionando",
        rotas: [
            "/ranking",
            "/piloto/:id",
            "/corridas",
            "/duplas",
            "/h2h/:id1/:id2"
        ]
    });
});

app.get("/corrida/:numero", (req, res) => {

    const corridas = carregarJSON("corridas.json");

    const corrida = corridas.find(
        c => String(c.numero) === String(req.params.numero)
    );

    if (!corrida) {
        return res.status(404).json({
            error: "Corrida não encontrada"
        });
    }

    res.json(corrida);
});

app.get("/previsao/:id1/:id2/:pista", (req, res) => {
    const { id1, id2, pista } = req.params;

    const ranking = carregarJSON("ranking_mmr.json");
    const corridas = carregarJSON("corridas.json");

    const piloto1 = ranking.find(p => String(p.id) === String(id1));
    const piloto2 = ranking.find(p => String(p.id) === String(id2));

    if (!piloto1 || !piloto2) {
        return res.status(404).json({
            error: "Piloto não encontrado"
        });
    }

    function chancePorMMR(mmrA, mmrB) {
        return 1 / (1 + Math.pow(10, (mmrB - mmrA) / 400));
    }

    function pegarStatsPista(piloto, pistaBuscada) {
        if (!piloto.desempenhoPorPista) return null;

        const nomePista = Object.keys(piloto.desempenhoPorPista).find(
            p => p.toLowerCase() === pistaBuscada.toLowerCase()
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
        return Math.max(0, Math.min(1, (valor + 5) / 10));
    }

    function calcularH2H(idA, idB) {
        let vitoriasA = 0;
        let vitoriasB = 0;
        let total = 0;

        for (const corrida of corridas) {
            const pA = corrida.participantes?.find(
                p => String(p.id) === String(idA)
            );

            const pB = corrida.participantes?.find(
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

    const statsPista1 = pegarStatsPista(piloto1, pista);
    const statsPista2 = pegarStatsPista(piloto2, pista);
    const h2h = calcularH2H(id1, id2);

    const scoreMMR1 = chancePorMMR(piloto1.mmr, piloto2.mmr);
    const scoreMMR2 = 1 - scoreMMR1;

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

    const scoreForma1 = normalizarForma(formaRecente(piloto1));
    const scoreForma2 = normalizarForma(formaRecente(piloto2));

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

    res.json({
        pista,
        piloto1: {
            id: piloto1.id,
            nome: piloto1.nomeAtual || piloto1.nome,
            mmr: piloto1.mmr,
            winrate: piloto1.winrate,
            chance: Number((chance1 * 100).toFixed(1)),
            odd: Number((1 / chance1).toFixed(2))
        },
        piloto2: {
            id: piloto2.id,
            nome: piloto2.nomeAtual || piloto2.nome,
            mmr: piloto2.mmr,
            winrate: piloto2.winrate,
            chance: Number((chance2 * 100).toFixed(1)),
            odd: Number((1 / chance2).toFixed(2))
        },
        favorito: chance1 > chance2
            ? piloto1.nomeAtual || piloto1.nome
            : piloto2.nomeAtual || piloto2.nome,
        h2h,
        pesos: {
            mmr: 40,
            h2h: 25,
            pista: 15,
            formaRecente: 10,
            winrate: 10
        }
    });
});

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});