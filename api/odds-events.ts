function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { sport = "soccer" } = req.query;
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "ODDS_API_KEY não configurada" });
  }

  try {
    const url =
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/` +
      `?apiKey=${apiKey}&regions=eu&markets=h2h,spreads&oddsFormat=decimal`;

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: "Erro ao buscar eventos",
        details: text
      });
    }

    const data = await response.json();

    const events = Array.isArray(data)
      ? data.map((g) => ({
          home_team: g.home_team,
          away_team: g.away_team,
          sport_key: g.sport_key,
          commence_time: g.commence_time
        }))
      : [];

    return res.status(200).json({
      sport,
      total: events.length,
      events
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno ao buscar eventos",
      details: String(error)
    });
  }
}
