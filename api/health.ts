export function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: "gpt-betting-api",
      version: "1.0.0"
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
