function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function fetchJson(url, apiKey) {
  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API-Football ${response.status}: ${text}`);
  }

  return response.json();
}

function summarizeLastMatches(matches, teamId) {
  const simplified = matches.map((m) => {
    const isHome = m.teams.home.id === teamId;
    const gf = isHome ? m.goals.home : m.goals.away;
    const ga = isHome ? m.goals.away : m.goals.home;

    let result = "D";
    if (gf > ga) result = "W";
    if (gf < ga) result = "L";

    return {
      date: m.fixture.date,
      opponent: isHome ? m.teams.away.name : m.teams.home.name,
      venue: isHome ? "home" : "away",
      goals_for: gf,
      goals_against: ga,
      result
    };
  });

  const goalsFor = simplified.reduce((sum, m) => sum + m.goals_for, 0);
  const goalsAgainst = simplified.reduce((sum, m) => sum + m.goals_against, 0);
  const form = simplified.map((m) => m.result);

  return {
    form,
    goals_for: goalsFor,
    goals_against: goalsAgainst,
    matches: simplified
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { home_team, away_team } = req.query;
  const apiKey = process.env.FOOTBALL_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "FOOTBALL_API_KEY não configurada" });
  }

  if (!home_team || !away_team) {
    return res.status(400).json({ error: "Informe home_team e away_team" });
  }

  try {
    const homeSearch = await fetchJson(
      `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(home_team)}`,
      apiKey
    );

    const awaySearch = await fetchJson(
      `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(away_team)}`,
      apiKey
    );

    const homeTeam = homeSearch.response?.[0]?.team;
    const awayTeam = awaySearch.response?.[0]?.team;

    if (!homeTeam || !awayTeam) {
      return res.status(404).json({
        error: "Não foi possível localizar um ou ambos os times",
        searched: { home_team, away_team }
      });
    }

    const homeFixtures = await fetchJson(
      `https://v3.football.api-sports.io/fixtures?team=${homeTeam.id}&last=5`,
      apiKey
    );

    const awayFixtures = await fetchJson(
      `https://v3.football.api-sports.io/fixtures?team=${awayTeam.id}&last=5`,
      apiKey
    );

    const h2hFixtures = await fetchJson(
      `https://v3.football.api-sports.io/fixtures/headtohead?h2h=${homeTeam.id}-${awayTeam.id}&last=5`,
      apiKey
    );

    const homeSummary = summarizeLastMatches(homeFixtures.response || [], homeTeam.id);
    const awaySummary = summarizeLastMatches(awayFixtures.response || [], awayTeam.id);

    return res.status(200).json({
      home_team: {
        id: homeTeam.id,
        name: homeTeam.name,
        country: homeTeam.country,
        recent_form: homeSummary.form,
        recent_goals_for: homeSummary.goals_for,
        recent_goals_against: homeSummary.goals_against,
        recent_matches: homeSummary.matches
      },
      away_team: {
        id: awayTeam.id,
        name: awayTeam.name,
        country: awayTeam.country,
        recent_form: awaySummary.form,
        recent_goals_for: awaySummary.goals_for,
        recent_goals_against: awaySummary.goals_against,
        recent_matches: awaySummary.matches
      },
      head_to_head: (h2hFixtures.response || []).map((m) => ({
        date: m.fixture.date,
        home: m.teams.home.name,
        away: m.teams.away.name,
        goals_home: m.goals.home,
        goals_away: m.goals.away
      }))
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao buscar dados do jogo",
      details: String(error)
    });
  }
}
