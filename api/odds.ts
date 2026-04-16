export function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const homeTeam = searchParams.get("home_team") || "";
  const awayTeam = searchParams.get("away_team") || "";

  return new Response(
    JSON.stringify({
      home_team: homeTeam,
      away_team: awayTeam,
      bookmaker: "KTO",
      odds: {
        home_win: 2.05,
        draw: 3.2,
        away_win: 3.6,
        draw_no_bet_home: 1.52,
        draw_no_bet_away: 2.3,
        asian_handicap_home_minus_025: 1.78,
        asian_handicap_away_plus_05: 1.66
      },
      updated_at: new Date().toISOString(),
      notes: [
        "Na fase 2, substitua por uma fonte real estável.",
        "Use este endpoint para análise, não para execução automática de apostas."
      ]
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
