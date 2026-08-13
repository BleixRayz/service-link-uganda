## Firebase setup for provider auth & uploads

I added a provider dashboard (provider.html) with sign-up/sign-in and a dashboard where authenticated providers can upload video clips, preview them, and manage (delete) their uploads. The implementation uses Firebase Authentication, Firebase Storage, and Firestore.

Files added:
- provider.html — provider sign-up/sign-in & dashboard UI
- provider.js — client code (Firebase init, auth, storage upload, Firestore)
- firebase-config.js — placeholder file where you must paste your Firebase config

How to enable (step-by-step)
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication → Sign-in method → Email/Password (optionally enable Google provider).
3. Enable Firestore Database (start in test mode during development) and create a collection `clips` (no documents required).
4. Enable Storage and note the storage bucket name.
5. Copy your Firebase web config (Project Settings → General → Your apps → Firebase SDK snippet) and paste it into firebase-config.js replacing the window.FIREBASE_CONFIG object.

Example firebase-config.js
```
window.FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "...",
  appId: "1:...:web:..."
};
```

Recommended security rules (example)

Firestore rules (allow owners to read/write their clips):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clips/{docId} {
      allow create: if request.auth != null && request.resource.data.owner == request.auth.uid;
      allow read: if request.auth != null && resource.data.owner == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.owner == request.auth.uid;
    }
  }
}
```

Storage rules (allow owners to write under their user folder):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /clips/{userId}/{allPaths=**} {
      allow read: if true; // public read for playback; make more restrictive if needed
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Notes & next steps
- The site currently expects the firebase-config.js file to contain a window.FIREBASE_CONFIG object. Paste your config and reload provider.html.
- Consider stricter Firestore/Storage rules for production; the examples above are starting points.
- If you want public clips to appear on the main site, I can add a moderation/approval flow: new uploads are flagged as `pending` and an admin UI approves them to be shown publicly.
- I can also add Google Sign-In or link provider profiles for richer metadata.
