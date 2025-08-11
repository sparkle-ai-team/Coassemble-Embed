// api/chat.js
// Vercel serverless function (Node 20, ESM) using Google Gemini

export default async function handler(req, res) {
  // Basic CORS (helps when embedded in Coassemble)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY on the server' });
    }

    // Handle both parsed and raw bodies
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const {
      messages = [],
      system = 'You are a concise, friendly course assistant embedded in a Coassemble lesson. Keep answers short and on-topic.',
      model = 'gemini-1.5-flash',     // good, fast, and available on free tier
      temperature = 0.7
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Request must include a non-empty messages array' });
    }

    // Convert OpenAI-style messages -> Gemini "contents"
    // Gemini expects a sequence of contents with role "user" or "model".
    const contents = [];
    if (system) {
      // Gemini supports system instruction separately; also safe to prepend as a user part.
      contents.push({ role: 'user', parts: [{ text: `(system) ${system}` }] });
    }
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: String(m.content ?? '') }] });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature }
      })
    });

    if (!r.ok) {
      const details = await r.text();
      return res.status(r.status).json({ error: 'Upstream error', details });
    }

    const data = await r.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ??
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      '';

    return res.status(200).json({ content: text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}


