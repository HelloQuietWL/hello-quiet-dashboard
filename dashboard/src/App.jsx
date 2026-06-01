import { useEffect, useState } from "react";
import {
  getRanking,
  getPiloto,
  getCorridas,
  getCorrida,
  getH2H,
  getPrevisao
} from "./api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 }
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

export default function App() {
  const [page, setPage] = useState("home");
  const [ranking, setRanking] = useState([]);
  const [pilotoId, setPilotoId] = useState("");
  const [piloto, setPiloto] = useState(null);
  const [erroPiloto, setErroPiloto] = useState("");
  const [corridas, setCorridas] = useState([]);
  const [corridaSelecionada, setCorridaSelecionada] = useState(null);

  const [h2hId1, setH2hId1] = useState("");
  const [h2hId2, setH2hId2] = useState("");
  const [h2hData, setH2hData] = useState(null);
  const [h2hErro, setH2hErro] = useState("");

  const [prevId1, setPrevId1] = useState("");
  const [prevId2, setPrevId2] = useState("");
  const [prevPista, setPrevPista] = useState("");
  const [previsaoData, setPrevisaoData] = useState(null);
  const [previsaoErro, setPrevisaoErro] = useState("");

  useEffect(() => {
    async function load() {
      const rankingData = await getRanking();
      const corridasData = await getCorridas();

      setRanking(rankingData);
      setCorridas(corridasData);
    }

    load();
  }, []);

  async function buscarPiloto(e) {
    e.preventDefault();

    if (!pilotoId.trim()) return;

    const data = await getPiloto(pilotoId);

    if (!data) {
      setPiloto(null);
      setErroPiloto("Piloto não encontrado.");
      return;
    }

    setErroPiloto("");
    setPiloto(data);
  }

  async function buscarH2H(e) {
    e.preventDefault();

    if (!h2hId1.trim() || !h2hId2.trim()) return;

    const data = await getH2H(h2hId1, h2hId2);

    if (!data || data.total === 0) {
      setH2hData(null);
      setH2hErro("Esses pilotos ainda não correram juntos.");
      return;
    }

    setH2hErro("");
    setH2hData(data);
  }

  async function buscarPrevisao(e) {
    e.preventDefault();

    if (!prevId1.trim() || !prevId2.trim() || !prevPista.trim()) return;

    const data = await getPrevisao(prevId1, prevId2, prevPista);

    if (!data) {
      setPrevisaoData(null);
      setPrevisaoErro("Não foi possível calcular a previsão.");
      return;
    }

    setPrevisaoErro("");
    setPrevisaoData(data);
  } async function buscarPrevisao(e) {
    e.preventDefault();

    if (!prevId1.trim() || !prevId2.trim() || !prevPista.trim()) return;

    const data = await getPrevisao(prevId1, prevId2, prevPista);

    if (!data) {
      setPrevisaoData(null);
      setPrevisaoErro("Não foi possível calcular a previsão.");
      return;
    }

    setPrevisaoErro("");
    setPrevisaoData(data);
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">HQ</span>
          <div>
            <strong>Hello Quiet</strong>
            <small>Racing System</small>
          </div>
        </div>

        <nav>
          <button
            className={page === "home" ? "active" : ""}
            onClick={() => setPage("home")}
          >
            🏠 Dashboard
          </button>
          <button
            className={page === "ranking" ? "active" : ""}
            onClick={() => setPage("ranking")}
          >
            🏆 Ranking
          </button>

          <button
            className={page === "piloto" ? "active" : ""}
            onClick={() => setPage("piloto")}
          >
            👤 Piloto
          </button>
          <button
            className={page === "corridas" ? "active" : ""}
            onClick={() => setPage("corridas")}
          >
            🏁 Corridas
          </button>
          <button
            className={page === "h2h" ? "active" : ""}
            onClick={() => setPage("h2h")}
          >
            ⚔️ H2H
          </button>
          <button
            className={page === "previsao" ? "active" : ""}
            onClick={() => setPage("previsao")}
          >
            📊 Previsão
          </button>
        </nav>

        <div className="sidebar-footer">
          <span>Underground Racing</span>
          <strong>{ranking.length} pilotos</strong>
        </div>
      </aside>

      <main className="main">
        {page === "home" && (
          <HomePage ranking={ranking} corridas={corridas} />
        )}
        {page === "ranking" && (
          <RankingPage ranking={ranking} />
        )}

        {page === "piloto" && (
          <PilotoPage
            pilotoId={pilotoId}
            setPilotoId={setPilotoId}
            buscarPiloto={buscarPiloto}
            piloto={piloto}
            erroPiloto={erroPiloto}
          />
        )}
        {page === "corridas" && (
          <CorridasPage
            corridas={corridas}
            setCorridaSelecionada={setCorridaSelecionada}
          />
        )}
        {corridaSelecionada && (
          <CorridaModal
            corrida={corridaSelecionada}
            ranking={ranking}
            fechar={() => setCorridaSelecionada(null)}
          />
        )}
        {page === "h2h" && (
          <H2HPage
            h2hId1={h2hId1}
            h2hId2={h2hId2}
            setH2hId1={setH2hId1}
            setH2hId2={setH2hId2}
            buscarH2H={buscarH2H}
            h2hData={h2hData}
            h2hErro={h2hErro}
          />
        )}
        {page === "previsao" && (
          <PrevisaoPage
            prevId1={prevId1}
            prevId2={prevId2}
            prevPista={prevPista}
            setPrevId1={setPrevId1}
            setPrevId2={setPrevId2}
            setPrevPista={setPrevPista}
            buscarPrevisao={buscarPrevisao}
            previsaoData={previsaoData}
            previsaoErro={previsaoErro}
          />
        )}
      </main>
    </div>
  );
}

function RankingPage({ ranking }) {
  const top16 = ranking.slice(0, 16);
  const top1 = ranking[0];

  return (
    <section className="premium-page">
      <div className="premium-page-hero">
        <div>
          <p className="eyebrow">Ranking competitivo</p>
          <h1>Top 16 MMR</h1>
          <p>
            Classificação oficial baseada nas corridas registradas pelo webhook.
          </p>
        </div>

        <div className="premium-highlight-card">
          <span>Líder atual</span>
          <strong>{top1 ? top1.nomeAtual || top1.nome : "Sem dados"}</strong>
          <p>{top1 ? `${top1.mmr} MMR` : "Aguardando dados"}</p>
        </div>
      </div>

      <div className="ranking-premium full-ranking">
        <div className="panel-header">
          <h2>Leaderboard</h2>
          <span>{top16.length} pilotos exibidos</span>
        </div>

        <div className="premium-table">
          {top16.map((piloto, index) => {
            const tier = getTier(piloto.mmr);

            return (
              <div
                className={`premium-row ${index < 3 ? "premium-top" : ""}`}
                key={piloto.id}
              >
                <div className="premium-pos">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                </div>

                <div className="premium-driver">
                  <strong>{piloto.nomeAtual || piloto.nome}</strong>
                  <span>ID {piloto.id}</span>
                </div>

                <div className={`tier-badge ${tier.className}`}>
                  <img src={tier.image} alt={tier.name} className="tier-icon" />
                  <strong>{tier.name}</strong>
                </div>

                <div className="premium-mmr">
                  <strong>{piloto.mmr}</strong>
                  <span>MMR</span>
                </div>

                <div className="premium-mmr">
                  <strong>{piloto.winrate}%</strong>
                  <span>WR</span>
                </div>

                <div className="premium-mmr">
                  <strong>{piloto.corridas}</strong>
                  <span>Corridas</span>
                </div>

                <div className="premium-mmr">
                  <strong>{piloto.top3}</strong>
                  <span>Top 3</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PilotoPage({
  pilotoId,
  setPilotoId,
  buscarPiloto,
  piloto,
  erroPiloto
}) {
  const tierPiloto = piloto
    ? getTier(piloto.mmr)
    : null;

  const dadosMMR = piloto?.ultimasCorridas
    ? piloto.ultimasCorridas.map((corrida, index) => ({
      nome: `#${corrida.corrida || index + 1}`,
      mmr: corrida.mmrDepois,
      ganho: corrida.ganhoMMR
    }))
    : [];

  return (
    <section className="premium-page">
      <div className="premium-page-hero">
        <div>
          <p className="eyebrow">Perfil competitivo</p>
          <h1>Buscar Piloto</h1>
          <p>
            Consulte MMR, tier, winrate, top 3, evolução e histórico recente.
          </p>
        </div>
      </div>

      <form className="premium-search" onSubmit={buscarPiloto}>
        <input
          value={pilotoId}
          onChange={e => setPilotoId(e.target.value)}
          placeholder="Digite o ID do piloto..."
        />

        <button>Buscar</button>
      </form>

      {erroPiloto && (
        <div className="premium-empty">
          {erroPiloto}
        </div>
      )}

      {piloto && (
        <section className="pilot-premium-grid">
          <div className="pilot-hero-card">
            <div>
              <p className="eyebrow">Piloto</p>
              <h2>{piloto.nomeAtual || piloto.nome}</h2>
              <span>ID {piloto.id}</span>

              {tierPiloto && (
                <div className={`tier-badge profile-tier ${tierPiloto.className}`}>
                  <img src={tierPiloto.image} alt={tierPiloto.name} className="tier-icon" />
                  <strong>{tierPiloto.name}</strong>
                </div>
              )}
            </div>

            <div className="mmr-display">
              <strong>{piloto.mmr}</strong>
              <span>MMR</span>
            </div>
          </div>

          <div className="premium-stat-card">
            <span>Winrate</span>
            <strong>{piloto.winrate}%</strong>
          </div>

          <div className="premium-stat-card">
            <span>Top 3 Rate</span>
            <strong>{piloto.podiumRate}%</strong>
          </div>

          <div className="premium-stat-card">
            <span>Corridas</span>
            <strong>{piloto.corridas}</strong>
          </div>

          <div className="premium-stat-card">
            <span>Vitórias</span>
            <strong>{piloto.vitorias}</strong>
          </div>

          <div className="premium-stat-card">
            <span>Média</span>
            <strong>{piloto.mediaColocacao}</strong>
          </div>

          <div className="premium-stat-card">
            <span>Melhor</span>
            <strong>{piloto.melhorColocacao}º</strong>
          </div>

          <div className="profile-card chart-card premium-chart">
            <div className="chart-header">
              <div>
                <h3>Evolução de MMR</h3>
                <span>Últimas corridas registradas</span>
              </div>
            </div>

            {dadosMMR.length > 1 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dadosMMR}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="nome"
                    stroke="#aaa8b8"
                    tick={{ fill: "#aaa8b8", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#aaa8b8"
                    tick={{ fill: "#aaa8b8", fontSize: 12 }}
                    domain={["dataMin - 20", "dataMax + 20"]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0d0d15",
                      border: "1px solid rgba(255,97,173,0.35)",
                      borderRadius: "14px",
                      color: "#fff"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mmr"
                    stroke="#ff61ad"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#ff61ad"
                    }}
                    activeDot={{
                      r: 7
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="muted">Ainda não há dados suficientes para o gráfico.</p>
            )}
          </div>

          <div className="profile-card premium-recent">
            <h3>Últimas corridas</h3>

            {piloto.ultimasCorridas?.length > 0 ? (
              piloto.ultimasCorridas
                .slice()
                .reverse()
                .slice(0, 6)
                .map((corrida, index) => {
                  const sinal = corrida.ganhoMMR >= 0 ? "+" : "";

                  return (
                    <div className="recent-race premium-recent-row" key={index}>
                      <strong>{corrida.posicao}º • {corrida.pista}</strong>
                      <span>{sinal}{corrida.ganhoMMR} MMR</span>
                    </div>
                  );
                })
            ) : (
              <p className="muted">Sem corridas recentes.</p>
            )}
          </div>

          <div className="profile-card premium-names">
            <h3>Histórico de nomes</h3>
            <p className="muted">
              {piloto.historicoNomes?.length > 0
                ? piloto.historicoNomes.join(" • ")
                : "Sem histórico registrado."}
            </p>
          </div>
        </section>
      )}
    </section>
  );
}

function InfoCard({ title, value }) {
  return (
    <div className="profile-card mini">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CorridasPage({
  corridas,
  setCorridaSelecionada
}) {
  const recentes = corridas
    .slice()
    .reverse();

  return (
    <section className="premium-page">
      <div className="premium-page-hero">
        <div>
          <p className="eyebrow">Histórico oficial</p>
          <h1>Corridas</h1>
          <p>
            Todas as corridas registradas pelo webhook, com vencedor,
            pista, modo e participantes.
          </p>
        </div>

        <div className="premium-highlight-card">
          <span>Total de corridas</span>
          <strong>{corridas.length}</strong>
          <p>Registradas no sistema</p>
        </div>
      </div>

      <section className="corridas-premium-grid">
        {recentes.map(corrida => {
          const vencedor = corrida.participantes?.[0];
          const total = corrida.participantes?.length || 0;

          return (
            <div
              className="corrida-premium-card"
              key={corrida.numero}
              onClick={() => setCorridaSelecionada(corrida)}
            >
              <div className="race-number">
                #{corrida.numero}
              </div>

              <div className="race-main">
                <p className="eyebrow">{corrida.modo}</p>
                <h2>{corrida.pista}</h2>
              </div>

              <div className="race-winner-box">
                <span>Vencedor</span>
                <strong>{vencedor?.nome || "?"}</strong>
                <p>ID {vencedor?.id || "?"}</p>
              </div>

              <div className="race-footer">
                <div>
                  <span>Participantes</span>
                  <strong>{total}</strong>
                </div>

                <div>
                  <span>Melhor tempo</span>
                  <strong>{vencedor?.tempo || "-"}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </section>
  );
}

function CorridaModal({
  corrida,
  ranking,
  fechar
}) {
  const vencedor = corrida.participantes?.[0];

  function buscarGanhoMMR(pilotoId) {
    const pilotoRanking = ranking.find(p =>
      String(p.id) === String(pilotoId)
    );

    if (!pilotoRanking || !pilotoRanking.ultimasCorridas) {
      return null;
    }

    const corridaMMR = pilotoRanking.ultimasCorridas.find(c =>
      String(c.corrida) === String(corrida.numero)
    );

    return corridaMMR ? corridaMMR.ganhoMMR : null;
  }

  return (
    <div className="modal-overlay">
      <div className="corrida-modal-premium">
        <button
          className="close-btn"
          onClick={fechar}
        >
          ✕
        </button>

        <div className="corrida-modal-hero">
          <div>
            <p className="eyebrow">Corrida #{corrida.numero}</p>
            <h2>{corrida.pista}</h2>
            <span>{corrida.modo}</span>
          </div>

          <div className="winner-card">
            <span>Vencedor</span>
            <strong>{vencedor?.nome || "?"}</strong>
            <p>{vencedor?.tempo || "-"}</p>
          </div>
        </div>

        <div className="resultado-premium-list">
          {corrida.participantes?.map((piloto, index) => {
            let posicao = `#${piloto.posicao}`;

            if (index === 0) posicao = "🥇";
            if (index === 1) posicao = "🥈";
            if (index === 2) posicao = "🥉";

            const ganhoMMR = buscarGanhoMMR(piloto.id);
            const sinal = ganhoMMR >= 0 ? "+" : "";

            return (
              <div
                className={`resultado-premium-row ${index < 3 ? "podium-row" : ""}`}
                key={index}
              >
                <div className="resultado-premium-pos">
                  {posicao}
                </div>

                <div className="resultado-premium-driver">
                  <strong>{piloto.nome}</strong>
                  <span>ID {piloto.id}</span>
                </div>

                <div className="resultado-premium-stat">
                  <span>Tempo</span>
                  <strong>{piloto.tempo}</strong>
                </div>

                <div className="resultado-premium-stat">
                  <span>MMR</span>
                  <strong>
                    {ganhoMMR !== null
                      ? `${sinal}${ganhoMMR}`
                      : "-"}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function H2HPage({
  h2hId1,
  h2hId2,
  setH2hId1,
  setH2hId2,
  buscarH2H,
  h2hData,
  h2hErro
}) {
  const total = h2hData?.total || 0;

  const wr1 = total > 0
    ? ((h2hData.vitorias1 / total) * 100).toFixed(1)
    : 0;

  const wr2 = total > 0
    ? ((h2hData.vitorias2 / total) * 100).toFixed(1)
    : 0;

  const dominante = h2hData
    ? h2hData.vitorias1 > h2hData.vitorias2
      ? h2hData.nome1 || `ID ${h2hData.id1}`
      : h2hData.vitorias2 > h2hData.vitorias1
        ? h2hData.nome2 || `ID ${h2hData.id2}`
        : "Empate"
    : null;

  return (
    <section className="premium-page">
      <div className="premium-page-hero">
        <div>
          <p className="eyebrow">Rivalidade</p>
          <h1>Head-to-Head</h1>
          <p>
            Compare dois pilotos e veja quem domina o confronto direto.
          </p>
        </div>

        <div className="premium-highlight-card">
          <span>Confrontos</span>
          <strong>{total}</strong>
          <p>{dominante ? `Dominante: ${dominante}` : "Aguardando comparação"}</p>
        </div>
      </div>

      <form className="premium-search h2h-premium-search" onSubmit={buscarH2H}>
        <input
          value={h2hId1}
          onChange={e => setH2hId1(e.target.value)}
          placeholder="ID do piloto 1"
        />

        <input
          value={h2hId2}
          onChange={e => setH2hId2(e.target.value)}
          placeholder="ID do piloto 2"
        />

        <button>Comparar</button>
      </form>

      {h2hErro && (
        <div className="premium-empty">
          {h2hErro}
        </div>
      )}

      {h2hData && (
        <section className="h2h-premium-layout">
          <div className="duel-card">
            <div className="duel-player">
              <span>Piloto 1</span>
              <strong>{h2hData.nome1 || `ID ${h2hData.id1}`}</strong>
              <p>ID {h2hData.id1}</p>

              <div className="duel-record">
                <b>{h2hData.vitorias1}</b>
                <span>Vitórias</span>
              </div>
            </div>

            <div className="duel-center">
              <div className="duel-score">
                <strong>{h2hData.vitorias1}</strong>
                <span>VS</span>
                <strong>{h2hData.vitorias2}</strong>
              </div>

              <p>{total} confrontos totais</p>
            </div>

            <div className="duel-player right">
              <span>Piloto 2</span>
              <strong>{h2hData.nome2 || `ID ${h2hData.id2}`}</strong>
              <p>ID {h2hData.id2}</p>

              <div className="duel-record">
                <b>{h2hData.vitorias2}</b>
                <span>Vitórias</span>
              </div>
            </div>
          </div>

          <div className="dominance-card">
            <div className="dominance-header">
              <span>Domínio do confronto</span>
              <strong>{dominante}</strong>
            </div>

            <div className="dominance-bar">
              <div
                className="dominance-fill"
                style={{ width: `${wr1}%` }}
              >
                {wr1}%
              </div>

              <div className="dominance-rest">
                {wr2}%
              </div>
            </div>

            <div className="dominance-labels">
              <span>{h2hData.nome1 || `ID ${h2hData.id1}`}</span>
              <span>{h2hData.nome2 || `ID ${h2hData.id2}`}</span>
            </div>
          </div>

          <div className="h2h-history-premium">
            <div className="panel-header">
              <h2>Últimos confrontos</h2>
              <span>Histórico direto</span>
            </div>

            <div className="h2h-premium-list">
              {h2hData.confrontos.map(confronto => {
                const vencedorNome =
                  String(confronto.vencedor) === String(h2hData.id1)
                    ? h2hData.nome1 || `ID ${h2hData.id1}`
                    : h2hData.nome2 || `ID ${h2hData.id2}`;

                return (
                  <div className="h2h-premium-race" key={confronto.corrida}>
                    <div className="h2h-race-main">
                      <span>Corrida #{confronto.corrida}</span>
                      <strong>{confronto.pista}</strong>
                    </div>

                    <div className="h2h-race-results">
                      <div>
                        <span>{h2hData.nome1 || `ID ${h2hData.id1}`}</span>
                        <strong>{confronto.id1.posicao}º</strong>
                        <small>{confronto.id1.tempo}</small>
                      </div>

                      <div>
                        <span>{h2hData.nome2 || `ID ${h2hData.id2}`}</span>
                        <strong>{confronto.id2.posicao}º</strong>
                        <small>{confronto.id2.tempo}</small>
                      </div>
                    </div>

                    <div className="winner-pill premium-winner">
                      Vencedor: {vencedorNome}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </section>
  );
}

function PrevisaoPage({
  prevId1,
  prevId2,
  prevPista,
  setPrevId1,
  setPrevId2,
  setPrevPista,
  buscarPrevisao,
  previsaoData,
  previsaoErro
}) {
  return (
    <>
      <section className="page-hero">
        <div>
          <p className="eyebrow">Análise competitiva</p>
          <h1>Previsão / ODD</h1>
          <p>
            Calcule favorito, chance estimada e ODD usando MMR, H2H,
            pista, forma recente e winrate.
          </p>
        </div>
      </section>

      <form className="search-box previsao-search" onSubmit={buscarPrevisao}>
        <input
          value={prevId1}
          onChange={e => setPrevId1(e.target.value)}
          placeholder="ID do piloto 1"
        />

        <input
          value={prevId2}
          onChange={e => setPrevId2(e.target.value)}
          placeholder="ID do piloto 2"
        />

        <input
          value={prevPista}
          onChange={e => setPrevPista(e.target.value)}
          placeholder="Nome da pista"
        />

        <button>Calcular</button>
      </form>

      {previsaoErro && (
        <div className="error">{previsaoErro}</div>
      )}

      {previsaoData && (
        <section className="previsao-layout">
          <div className="previsao-card destaque">
            <span>Favorito</span>
            <strong>{previsaoData.favorito}</strong>
            <p>{previsaoData.pista}</p>
          </div>

          <div className="odds-grid">
            <PilotoOddCard piloto={previsaoData.piloto1} />
            <PilotoOddCard piloto={previsaoData.piloto2} />
          </div>

          <div className="chance-bar-card">
            <div className="chance-labels">
              <span>{previsaoData.piloto1.nome}</span>
              <span>{previsaoData.piloto2.nome}</span>
            </div>

            <div className="chance-bar">
              <div
                className="chance-fill"
                style={{
                  width: `${previsaoData.piloto1.chance}%`
                }}
              >
                {previsaoData.piloto1.chance}%
              </div>

              <div className="chance-rest">
                {previsaoData.piloto2.chance}%
              </div>
            </div>
          </div>

          <div className="profile-card wide">
            <h3>Head-to-Head</h3>
            <div className="summary-grid">
              <div>
                <span>Total</span>
                <strong>{previsaoData.h2h.total}</strong>
              </div>

              <div>
                <span>{previsaoData.piloto1.nome}</span>
                <strong>{previsaoData.h2h.vitoriasA}</strong>
              </div>

              <div>
                <span>{previsaoData.piloto2.nome}</span>
                <strong>{previsaoData.h2h.vitoriasB}</strong>
              </div>
            </div>
          </div>

          <div className="profile-card wide">
            <h3>Pesos usados</h3>
            <div className="weights-grid">
              <Weight label="MMR" value={previsaoData.pesos.mmr} />
              <Weight label="H2H" value={previsaoData.pesos.h2h} />
              <Weight label="Pista" value={previsaoData.pesos.pista} />
              <Weight label="Forma" value={previsaoData.pesos.formaRecente} />
              <Weight label="Winrate" value={previsaoData.pesos.winrate} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function PilotoOddCard({ piloto }) {
  return (
    <div className="previsao-card">
      <span>ID {piloto.id}</span>
      <strong>{piloto.nome}</strong>

      <div className="odd-number">
        {piloto.odd}
        <small>ODD</small>
      </div>

      <div className="previsao-stats">
        <span>Chance: <b>{piloto.chance}%</b></span>
        <span>MMR: <b>{piloto.mmr}</b></span>
        <span>WR: <b>{piloto.winrate}%</b></span>
      </div>
    </div>
  );
}

function Weight({ label, value }) {
  return (
    <div className="weight-item">
      <span>{label}</span>
      <strong>{value}%</strong>
    </div>
  );
}

function getTier(mmr = 0) {
  if (mmr >= 2200) return { name: "Legend", image: "/tiers/legend.png", className: "tier-legend" };
  if (mmr >= 1900) return { name: "Grandmaster", image: "/tiers/grandmaster.png", className: "tier-grandmaster" };
  if (mmr >= 1700) return { name: "Master", image: "/tiers/master.png", className: "tier-master" };
  if (mmr >= 1500) return { name: "Diamond", image: "/tiers/diamond.png", className: "tier-diamond" };
  if (mmr >= 1300) return { name: "Gold", image: "/tiers/gold.png", className: "tier-gold" };
  if (mmr >= 1150) return { name: "Silver", image: "/tiers/silver.png", className: "tier-silver" };

  return { name: "Bronze", image: "/tiers/bronze.png", className: "tier-bronze" };
}

function HomePage({ ranking, corridas }) {
  const top1 = ranking[0];
  const top6 = ranking.slice(0, 6);
  const ultimasCorridas = corridas.slice(-4).reverse();

  return (
    <motion.section
      className="home-grid"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div className="home-hero" variants={fadeUp}>
        <div className="hero-overlay">
          <p className="eyebrow">Próximo evento</p>
          <h1>Night Run</h1>
          <p className="hero-quote">
            “You hear us, but'll never see us”
          </p>

          <div className="hero-stats">
            <div>
              <span>Top 1</span>
              <strong>{top1 ? top1.nomeAtual || top1.nome : "Sem dados"}</strong>
            </div>

            <div>
              <span>MMR</span>
              <strong>{top1 ? top1.mmr : "-"}</strong>
            </div>

            <div>
              <span>Corridas</span>
              <strong>{corridas.length}</strong>
            </div>

            <div>
              <span>Pilotos</span>
              <strong>{ranking.length}</strong>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div className="side-widget event-widget" variants={fadeUp}>
        <p className="eyebrow">Começa em</p>
        <div className="countdown">
          <strong>02</strong>
          <span>Dias</span>
          <strong>18</strong>
          <span>Hrs</span>
          <strong>47</strong>
          <span>Min</span>
        </div>
      </motion.div>

      <motion.div className="side-widget server-widget" variants={fadeUp}>
        <p className="eyebrow">Status da equipe</p>
        <h2>HQX Racing Club</h2>
        <span className="online-dot">● Online</span>

        <div className="progress-bar">
          <div style={{ width: "73%" }} />
        </div>

        <p className="muted">Sistema competitivo ativo</p>
      </motion.div>

      <motion.div className="ranking-premium" variants={fadeUp}>
        <div className="panel-header">
          <h2>Ranking Geral</h2>
          <span>Top 6 pilotos</span>
        </div>

        <div className="premium-table">
          {top6.map((piloto, index) => {
            const tier = getTier(piloto.mmr);

            return (
              <motion.div
                className={`premium-row ${index < 3 ? "premium-top" : ""}`}
                key={piloto.id}
                variants={fadeUp}
                whileHover={{ x: 6, scale: 1.01 }}
              >
                <div className="premium-pos">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                </div>

                <div className="premium-driver">
                  <strong>{piloto.nomeAtual || piloto.nome}</strong>
                  <span>ID {piloto.id}</span>
                </div>

                <div className={`tier-badge ${tier.className}`}>
                  <img src={tier.image} alt={tier.name} className="tier-icon" />
                  <strong>{tier.name}</strong>
                </div>

                <div className="premium-mmr">
                  <strong>{piloto.mmr}</strong>
                  <span>MMR</span>
                </div>

                <div className="premium-mmr">
                  <strong>{piloto.winrate}%</strong>
                  <span>WR</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div className="side-widget hof-widget" variants={fadeUp}>
        <p className="eyebrow">Ícone do servidor</p>
        <div className="server-icon-card">
          <img src="/logo-hq.png" alt="Hello Quiet" />
        </div>
      </motion.div>

      <motion.div className="side-widget season-widget" variants={fadeUp}>
        <p className="eyebrow">Temporada 01</p>
        <h2>{top1 ? getTier(top1.mmr).name : "Unranked"}</h2>

        <div className="season-progress">
          <div style={{ width: "64%" }} />
        </div>

        <p className="muted">Progresso competitivo</p>
      </motion.div>

      <motion.div className="side-widget races-widget" variants={fadeUp}>
        <div className="panel-header">
          <h2>Últimas Corridas</h2>
          <span>Webhook</span>
        </div>

        {ultimasCorridas.map(corrida => (
          <motion.div
            className="mini-race"
            key={corrida.numero}
            whileHover={{ x: 5 }}
          >
            <div>
              <strong>{corrida.pista}</strong>
              <span>#{corrida.numero} • {corrida.modo}</span>
            </div>

            <p>🥇 {corrida.participantes?.[0]?.nome || "?"}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}