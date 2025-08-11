export default async function handler(req, res) {
  const hasKey = !!process.env.OPENAI_API_KEY;
  return res.status(200).json({ ok: true, hasKey, time: new Date().toISOString() });
}
