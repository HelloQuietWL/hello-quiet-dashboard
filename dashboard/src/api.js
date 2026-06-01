const API_URL = "https://hello-quiet-dashboard.onrender.com";

export async function getRanking() {
    const res = await fetch(`${API_URL}/ranking`);
    return res.json();
}

export async function getPiloto(id) {
    const res = await fetch(`${API_URL}/piloto/${id}`);

    if (!res.ok) {
        return null;
    }

    return res.json();
}

export async function getCorridas() {
    const res = await fetch(`${API_URL}/corridas`);
    return res.json();
}

export async function getCorrida(numero) {
    const res = await fetch(
        `${API_URL}/corrida/${numero}`
    );

    if (!res.ok) {
        return null;
    }

    return res.json();
}

export async function getH2H(id1, id2) {
    const res = await fetch(
        `${API_URL}/h2h/${id1}/${id2}`
    );

    if (!res.ok) {
        return null;
    }

    return res.json();
}

export async function getPrevisao(id1, id2, pista) {
    const res = await fetch(
        `${API_URL}/previsao/${id1}/${id2}/${encodeURIComponent(pista)}`
    );

    if (!res.ok) {
        return null;
    }

    return res.json();
}