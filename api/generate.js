// api/generate.js — Vercel serverless function (Node 18+)
// Deploy to Vercel by placing this file under /api/generate.js in the project root.
// Configure OPENAI_API_KEY as a project environment variable in Vercel (or your provider).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, title, category } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const system = `You are a helpful assistant that writes concise marketing descriptions for service providers and extracts 3-6 short tags.\nRespond with a JSON object containing { "text": "...", "tags": ["tag1","tag2"] }.\nDo not include any additional commentary outside the JSON.`;

    const userMessage = `Prompt: ${prompt}\nTitle: ${title || ''}\nCategory: ${category || ''}`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server misconfigured: missing OPENAI_API_KEY' });

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 400,
      temperature: 0.7
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
      const text = await r.text();
      return res.status(502).json({ error: 'AI provider error', details: text });
    }

    const data = await r.json();
    const assistant = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';

    // Try to extract JSON from assistant response
    let parsed = null;
    try {
      const start = assistant.indexOf('{');
      const jsonText = start >= 0 ? assistant.slice(start) : assistant;
      parsed = JSON.parse(jsonText);
    } catch (e) {
      // fallback: return raw text and empty tags
      return res.json({ text: assistant.trim(), tags: [] });
    }

    const text = parsed.text || parsed.description || '';
    const tags = Array.isArray(parsed.tags) ? parsed.tags : [];

    return res.json({ text: String(text).trim(), tags });
  } catch (err) {
    console.error('AI function error', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
