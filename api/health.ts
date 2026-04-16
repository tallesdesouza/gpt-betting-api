export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: "gpt-betting-api",
    version: "2.0.0"
  });
}
