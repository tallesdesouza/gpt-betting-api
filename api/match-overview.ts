export function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const homeTeam = searchParams.get("home_team") || "";
  const awayTeam = searchParams.get("away_team") || "";
  const competition = searchParams.get("competition") || "";

  return new Response(
    JSON.stringify({
      home_team: homeTeam,
      away_team: awayTeam,
      competition,
      summary: {
        home_form: "forte em casa",
        away_form: "regular fora",
        zebra_potential: "moderado",
        favorite_risk: "médio"
      },
      stats: {
        home_last5: ["W", "W", "D", "L", "W"],
        away_last5: ["D", "L", "W", "D", "W"],
        home_goals_last5: 9,
        away_goals_last5: 6,
        home_conceded_last5: 4,
        away_conceded_last5: 7
      },
      notes: [
        "Use este endpoint como base do racional do jogo.",
        "Na fase 2, troque esses dados mockados por dados reais."
      ]
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
