// api/chat.js - Vercel serverless function (Node.js, ESM)
// api/chat.js
// Serverless function for Vercel (Node.js, ESM)

export default async function handler(req, res) {
  // Basic CORS (helps when embedded)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY on the server' });
    }

    // Handle both parsed and raw bodies
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* ignore */ }
    }
    const { messages, system, model = 'gpt-4o-mini', temperature = 0.7 } = body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Request must include a messages array' });
    }

    const payload = {
      model,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...messages
      ],
      temperature
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const details = await r.text();
      return res.status(r.status).json({ error: 'Upstream error', details });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}

