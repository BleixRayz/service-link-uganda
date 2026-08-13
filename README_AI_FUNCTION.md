# Serverless AI function (Vercel / Netlify)

This folder contains two example serverless endpoints you can deploy to provide AI generation for the provider dashboard's AI assistant. The client (provider.js) will POST { prompt, title, category } and expects JSON { text, tags } in return.

Files included:
- api/generate.js — Vercel serverless function (deploy by adding to project root on Vercel)
- netlify/functions/generate.js — Netlify Functions example (deploy to Netlify)

Environment variables (required)
- OPENAI_API_KEY — put your OpenAI API key (or other model provider key) in the serverless platform's environment variables.

How to deploy

Vercel
1. Install the Vercel CLI or connect the repo in the Vercel dashboard.
2. Add OPENAI_API_KEY to your Vercel project Environment Variables.
3. Push the repo to GitHub and deploy — the Vercel function will be available at:
   https://<your-vercel-app>.vercel.app/api/generate
4. Copy that URL into firebase-config.js as:
   window.FIREBASE_CONFIG.aiEndpoint = 'https://<your-vercel-app>.vercel.app/api/generate';

Netlify
1. Connect the repo in Netlify or use the Netlify CLI.
2. Add OPENAI_API_KEY to Site settings → Build & deploy → Environment.
3. Deploy the site. The function will be available at:
   https://<your-netlify-site>/.netlify/functions/generate
4. Copy that URL into firebase-config.js as your aiEndpoint.

Security notes
- Do NOT put any AI provider keys in client-side code. Use these serverless functions to keep keys on the server.
- Add rate limits and authentication if you expect public/unauthenticated usage to avoid abuse and billing surprises.

Example request/response
- Request: POST application/json { "prompt":"Write a short description for a roofing business","title":"Roofing Co","category":"Construction" }
- Response: { "text":"We provide quality roofing...","tags":["roofing","construction","repairs"] }

If you want, I can:
- Add a small admin-only API key check so only authenticated clients (e.g., requests from your site) can use the endpoint.
- Add simple rate-limiting using memory or a third-party like Upstash.
- Add the serverless function deployment configuration for Vercel (vercel.json) or Netlify (netlify.toml).
