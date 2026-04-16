function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function includesTeamName(source = "", target = "") {
  const a = normalizeText(source);
  const b = normalizeText(target);
  return a.includes(b) || b.includes(a);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { home_team, away_team, sport = "soccer_brazil_campeonato" } = req.query;
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "ODDS_API_KEY não configurada" });
  }

  if (!home_team || !away_team) {
    return res.status(400).json({ error: "Informe home_team e away_team" });
  }

  try {
    const url =
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/` +
      `?apiKey=${apiKey}&regions=eu&markets=h2h,spreads&oddsFormat=decimal`;

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: "Erro ao buscar odds externas",
        details: text
      });
    }

    const data = await response.json();

    const game = Array.isArray(data)
      ? data.find(
          (g) =>
            includesTeamName(g.home_team, home_team) &&
            includesTeamName(g.away_team, away_team)
        )
      : null;

    if (!game) {
      return res.status(404).json({
        error: "Jogo não encontrado nas odds",
        searched: { home_team, away_team, sport }
      });
    }

    const bookmaker = Array.isArray(game.bookmakers) && game.bookmakers.length > 0
      ? game.bookmakers[0]
      : null;

    if (!bookmaker) {
      return res.status(404).json({
        error: "Nenhum bookmaker encontrado para este jogo"
      });
    }

    const h2hMarket = bookmaker.markets?.find((m) => m.key === "h2h");
    const spreadsMarket = bookmaker.markets?.find((m) => m.key === "spreads");

    return res.status(200).json({
      home_team: game.home_team,
      away_team: game.away_team,
      sport_key: game.sport_key,
      commence_time: game.commence_time,
      bookmaker: bookmaker.title,
      h2h: h2hMarket?.outcomes || [],
      spreads: spreadsMarket?.outcomes || [],
      raw_markets: bookmaker.markets || []
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno ao buscar odds",
      details: String(error)
    });
  }
}
