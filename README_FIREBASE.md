## Firebase + AI + WhatsApp notes

I added AI and WhatsApp support to the provider dashboard. Summary:

- AI assistant
  - The provider dashboard includes an AI panel where providers can enter a prompt and request generated text (description) and tags.
  - The dashboard expects an AI endpoint URL in `window.FIREBASE_CONFIG.aiEndpoint` (set this in `firebase-config.js`). The endpoint should accept a POST JSON body { prompt, title, category } and return JSON like { text: "generated description", tags: ["tag1","tag2"] }.
  - I did not include an AI API key in the repo. You can implement a simple serverless function (Vercel/Netlify/AWS Lambda) that proxies to OpenAI or another model provider and add its URL to firebase-config.js.

- WhatsApp contact
  - Providers can save a contact phone (international number, e.g., 2567...) in the dashboard profile area (saved to Firestore collection `providers` document <uid>).
  - Each uploaded clip in the provider's list includes a WhatsApp button that opens a chat with a templated message including the clip title.

Security & Operational notes
- AI endpoint: do not expose raw API keys from model providers in client-side code. Host a small serverless proxy that adds your API key server-side and call that endpoint from the dashboard.
- Storage & costs: large video uploads may incur costs. Consider size limits, retention periods or using lower-tier storage for older clips.

If you want, I can:
- Add an example serverless function (Node.js) that proxies to OpenAI's completion API and transforms responses into { text, tags }.
- Add Google Sign-In and/or admin approval flow for public listing of clips.
- Add server-side thumbnail generation (Cloud Functions) to improve page load.

