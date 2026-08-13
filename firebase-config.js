// firebase-config.js
// Paste your Firebase Web SDK configuration below.
// You can find this in the Firebase Console → Project Settings → General → Your apps (Web)
// Example:
// window.FIREBASE_CONFIG = {
//   apiKey: "...",
//   authDomain: "your-project.firebaseapp.com",
//   projectId: "your-project-id",
//   storageBucket: "your-project-id.appspot.com",
//   messagingSenderId: "...",
//   appId: "1:...:web:..."
// };

// AI endpoint (optional): If you have a serverless AI endpoint (e.g., an OpenAI proxy or server function)
// set window.FIREBASE_CONFIG.aiEndpoint = 'https://your-endpoint.example.com/ai/generate'
// The provider dashboard will POST { prompt, title, category } and expect JSON { text: "...", tags: ["tag1","tag2"] }

// IMPORTANT: Fill this object with your project's values before using the auth/upload features.
window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {};
window.FIREBASE_CONFIG.aiEndpoint = window.FIREBASE_CONFIG.aiEndpoint || "";
