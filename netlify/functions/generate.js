// netlify/functions/generate.js — Netlify function example
// Deploy by adding this file under netlify/functions/generate.js
// Configure OPENAI_API_KEY as a Netlify environment variable.

const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { prompt, title, category } = body;
    if (!prompt) return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt' }) };

    const system = `You are a helpful assistant that writes concise marketing descriptions for service providers and extracts 3-6 short tags.\nRespond with a JSON object containing { "text": "...", "tags": ["tag1","tag2"] }.\nDo not include any additional commentary outside the JSON.`;
    const userMessage = `Prompt: ${prompt}\nTitle: ${title || ''}\nCategory: ${category || ''}`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: missing OPENAI_API_KEY' }) };

    const payload = {
      model: 'gpt-4o-mini',
      messages: [ { role: 'system', content: system }, { role: 'user', content: userMessage } ],
      max_tokens: 400,
      temperature: 0.7
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'AI provider error', details: text }) };
    }

    const data = await r.json();
    const assistant = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';

    try {
      const start = assistant.indexOf('{');
      const jsonText = start >= 0 ? assistant.slice(start) : assistant;
      const parsed = JSON.parse(jsonText);
      const text = parsed.text || parsed.description || '';
      const tags = Array.isArray(parsed.tags) ? parsed.tags : [];
      return { statusCode: 200, body: JSON.stringify({ text: String(text).trim(), tags }) };
    } catch (e) {
      return { statusCode: 200, body: JSON.stringify({ text: assistant.trim(), tags: [] }) };
    }

  } catch (err) {
    console.error('generate function error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: err.message }) };
  }
};
