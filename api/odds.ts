function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tokenize(value = "") {
  return normalizeText(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function teamMatches(apiName = "", requestedName = "") {
  const apiTokens = tokenize(apiName);
  const reqTokens = tokenize(requestedName);

  if (!apiTokens.length || !reqTokens.length) return false;

  const overlap = reqTokens.filter((t) => apiTokens.includes(t));
  return overlap.length >= Math.min(1, reqTokens.length);
}

async function fetchOddsForSport(sport: string, apiKey: string) {
  const url =
    `https://api.the-odds-api.com/v4/sports/${sport}/odds/` +
    `?apiKey=${apiKey}&regions=eu&markets=h2h,spreads&oddsFormat=decimal`;

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Odds API ${response.status}: ${text}`);
  }

  return response.json();
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
    const sportsToTry = [sport, "soccer"].filter(
      (value, index, arr) => arr.indexOf(value) === index
    );

    let matchedGame = null;
    let matchedSport = null;
    let lastGames = [];

    for (const currentSport of sportsToTry) {
      const games = await fetchOddsForSport(currentSport, apiKey);
      lastGames = Array.isArray(games) ? games : [];

      matchedGame = lastGames.find((g) => {
        const homeOk = teamMatches(g.home_team, String(home_team));
        const awayOk = teamMatches(g.away_team, String(away_team));
        return homeOk && awayOk;
      });

      if (matchedGame) {
        matchedSport = currentSport;
        break;
      }
    }

    if (!matchedGame) {
      return res.status(404).json({
        error: "Jogo não encontrado nas odds",
        searched: { home_team, away_team, sport },
        sample_games: lastGames.slice(0, 10).map((g) => ({
          home_team: g.home_team,
          away_team: g.away_team,
          sport_key: g.sport_key,
          commence_time: g.commence_time
        }))
      });
    }

    const bookmaker =
      Array.isArray(matchedGame.bookmakers) && matchedGame.bookmakers.length > 0
        ? matchedGame.bookmakers[0]
        : null;

    if (!bookmaker) {
      return res.status(404).json({
        error: "Nenhum bookmaker encontrado para este jogo"
      });
    }

    const h2hMarket = bookmaker.markets?.find((m) => m.key === "h2h");
    const spreadsMarket = bookmaker.markets?.find((m) => m.key === "spreads");

    return res.status(200).json({
      home_team: matchedGame.home_team,
      away_team: matchedGame.away_team,
      sport_key: matchedSport,
      commence_time: matchedGame.commence_time,
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
