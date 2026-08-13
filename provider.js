// provider.js — Firebase auth + upload + Firestore logic
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, deleteDoc, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// Read config from firebase-config.js (window.FIREBASE_CONFIG)
if(!window.FIREBASE_CONFIG || Object.keys(window.FIREBASE_CONFIG).length === 0){
  alert('Firebase config not found. Please open firebase-config.js and paste your Firebase config.');
}

const app = initializeApp(window.FIREBASE_CONFIG || {});
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

// Elements
const signupForm = document.getElementById('signupForm');
const signinForm = document.getElementById('signinForm');
const toggleToSignIn = document.getElementById('toggleToSignIn');
const toggleToSignUp = document.getElementById('toggleToSignUp');
const signOutBtn = document.getElementById('signOutBtn');
const dashboard = document.getElementById('dashboard');
const uploadForm = document.getElementById('uploadForm');
const clipInput = document.getElementById('clipInput');
const progressEl = document.getElementById('progress');
const pct = document.getElementById('pct');
const uploadsList = document.getElementById('uploadsList');
const welcome = document.getElementById('welcome');
const phoneInput = document.getElementById('phoneInput');
const saveProfileBtn = document.getElementById('saveProfile');
const aiPrompt = document.getElementById('aiPrompt');
const aiGenerateBtn = document.getElementById('aiGenerate');
const aiSuggestions = document.getElementById('aiSuggestions');
const applyAiBtn = document.getElementById('applyAi');

// Switch forms
toggleToSignIn.addEventListener('click', ()=>{signupForm.style.display='none'; signinForm.style.display='block';});
toggleToSignUp.addEventListener('click', ()=>{signinForm.style.display='none'; signupForm.style.display='block';});

// Sign up
signupForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = signupForm.email.value;
  const password = signupForm.password.value;
  try{
    await createUserWithEmailAndPassword(auth, email, password);
  }catch(err){
    alert('Sign up error: ' + err.message);
  }
});

// Sign in
signinForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = signinForm.email.value;
  const password = signinForm.password.value;
  try{
    await signInWithEmailAndPassword(auth, email, password);
  }catch(err){
    alert('Sign in error: ' + err.message);
  }
});

// Sign out
signOutBtn.addEventListener('click', async ()=>{
  await signOut(auth);
});

// Save profile (phone)
saveProfileBtn.addEventListener('click', async ()=>{
  const user = auth.currentUser;
  if(!user) return alert('Not signed in');
  const phone = (phoneInput.value||'').trim();
  try{
    await setDoc(doc(db, 'providers', user.uid), { phone }, { merge: true });
    alert('Profile saved');
  }catch(err){
    alert('Could not save profile: '+err.message);
  }
});

// AI generate
aiGenerateBtn.addEventListener('click', async ()=>{
  const prompt = (aiPrompt.value||'').trim();
  if(!prompt) return alert('Enter a prompt for the AI');
  // endpoint from config
  const aiEndpoint = (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.aiEndpoint) || null;
  if(!aiEndpoint) return alert('AI endpoint not configured. Add FIREBASE_CONFIG.aiEndpoint in firebase-config.js pointing to your AI generation endpoint.');
  aiGenerateBtn.disabled = true; aiGenerateBtn.textContent = 'Generating...';
  try{
    const res = await fetch(aiEndpoint, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ prompt, title: uploadForm.title.value, category: uploadForm.category.value }) });
    if(!res.ok) throw new Error('AI endpoint error: '+res.status);
    const data = await res.json();
    // display suggestions
    aiSuggestions.innerHTML = '';
    const text = data.text || data.description || '';
    const tags = data.tags || [];
    if(text){
      const p = document.createElement('p'); p.textContent = text; aiSuggestions.appendChild(p);
    }
    if(tags && tags.length){
      const chips = document.createElement('div'); chips.className='chips';
      tags.forEach(t=>{ const c = document.createElement('span'); c.className='chip'; c.textContent = t; chips.appendChild(c); });
      aiSuggestions.appendChild(chips);
      // fill tags input
      uploadForm.tags.value = tags.join(', ');
    }
  }catch(err){
    alert('AI generation failed: '+err.message);
  }finally{ aiGenerateBtn.disabled = false; aiGenerateBtn.textContent = 'Generate'; }
});

applyAiBtn.addEventListener('click', ()=>{
  const p = aiSuggestions.querySelector('p');
  if(p) uploadForm.description.value = p.textContent;
});

// Auth state
onAuthStateChanged(auth, async (user)=>{
  if(user){
    // show dashboard
    signupForm.style.display='none';
    signinForm.style.display='none';
    dashboard.style.display='block';
    signOutBtn.style.display='inline-block';
    welcome.innerText = `Welcome, ${user.email}`;
    loadProfile(user.uid);
    loadUploads(user.uid);
  } else {
    // show auth
    signupForm.style.display='block';
    signinForm.style.display='none';
    dashboard.style.display='none';
    signOutBtn.style.display='none';
    welcome.innerText = 'Provider sign in / register';
  }
});

async function loadProfile(uid){
  try{
    const docRef = doc(db, 'providers', uid);
    const snap = await getDoc(docRef);
    if(snap.exists()){
      const data = snap.data();
      phoneInput.value = data.phone || '';
    }
  }catch(err){ console.warn('Could not load profile', err.message); }
}

// Upload form
uploadForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const user = auth.currentUser;
  if(!user) return alert('You must be signed in');
  const file = clipInput.files[0];
  if(!file) return alert('Pick a video file');

  // Basic validation
  const maxMB = 200; // recommended limit
  if(file.size > maxMB * 1024 * 1024) return alert('File too large — max '+maxMB+'MB');

  const title = uploadForm.title.value || 'Untitled';
  const category = uploadForm.category.value || 'Uncategorized';
  const description = uploadForm.description.value || '';
  const tags = (uploadForm.tags.value || '').split(',').map(t=>t.trim()).filter(Boolean);

  const path = `clips/${user.uid}/${Date.now()}_${file.name}`;
  const sRef = storageRef(storage, path);
  const uploadTask = uploadBytesResumable(sRef, file);

  progressEl.style.display = 'block';
  uploadTask.on('state_changed', (snapshot)=>{
    const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
    pct.textContent = percent + '%';
  }, (error)=>{
    progressEl.style.display = 'none';
    alert('Upload error: ' + error.message);
  }, async ()=>{
    progressEl.style.display = 'none';
    const url = await getDownloadURL(uploadTask.snapshot.ref);
    // save metadata to Firestore
    try{
      await addDoc(collection(db, 'clips'), {
        owner: user.uid,
        ownerEmail: user.email || null,
        title,
        category,
        description,
        tags,
        storagePath: path,
        url,
        createdAt: serverTimestamp(),
      });
      uploadForm.reset();
      loadUploads(user.uid);
      alert('Upload complete');
    }catch(err){
      alert('Error saving metadata: ' + err.message);
    }
  });
});

// Load uploads for provider
async function loadUploads(uid){
  uploadsList.innerHTML = '<p class="muted">Loading...</p>';
  try{
    const q = query(collection(db, 'clips'), where('owner','==',uid), orderBy('createdAt','desc'));
    const snap = await getDocs(q);
    uploadsList.innerHTML = '';
    if(snap.empty){
      uploadsList.innerHTML = '<p class="muted">No uploads yet.</p>';
      return;
    }
    // load provider phone
    let phone = '';
    try{ const pSnap = await getDoc(doc(db, 'providers', uid)); if(pSnap.exists()) phone = pSnap.data().phone || ''; }catch(e){}

    snap.forEach(docSnap=>{
      const data = docSnap.data();
      const id = docSnap.id;
      const item = document.createElement('div');
      item.className = 'upload-item';
      const waLink = phone ? makeWaLink(phone, `Hello, I saw your service "${data.title || 'Untitled'}" on Service Link Uganda. Can you provide more details?`) : null;
      item.innerHTML = `
        <video src="${data.url}" controls preload="metadata"></video>
        <div style="flex:1">
          <strong>${escapeHtml(data.title || 'Untitled')}</strong>
          <div class="muted">${escapeHtml(data.category || '')} • ${data.ownerEmail || ''}</div>
          <div class="muted">${escapeHtml(data.description || '')}</div>
          <div class="chips">${(data.tags||[]).map(t=>`<span class="chip">${escapeHtml(t)}</span>`).join('')}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn ghost delete-btn" data-id="${id}" data-path="${data.storagePath}">Delete</button>
          <a class="btn" href="${data.url}" target="_blank" rel="noopener">Open</a>
          ${waLink ? `<a class="btn" href="${waLink}" target="_blank" rel="noopener">WhatsApp</a>` : `<button class="btn ghost" disabled title="Set your phone to enable WhatsApp">WhatsApp</button>`}
        </div>
      `;
      uploadsList.appendChild(item);
    });

    // wire delete buttons
    document.querySelectorAll('.upload-item .delete-btn').forEach(b=>{
      b.addEventListener('click', async (e)=>{
        const id = e.target.dataset.id;
        const path = e.target.dataset.path;
        if(!confirm('Delete this clip?')) return;
        try{
          // delete storage object
          const delRef = storageRef(storage, path);
          await deleteObject(delRef);
        }catch(err){
          console.warn('Storage delete error (may be missing):', err.message);
        }
        try{
          await deleteDoc(doc(db, 'clips', id));
          loadUploads(auth.currentUser.uid);
        }catch(err){
          alert('Error deleting metadata: ' + err.message);
        }
      });
    });

  }catch(err){
    uploadsList.innerHTML = '<p class="muted">Failed to load uploads: '+err.message+'</p>';
  }
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function makeWaLink(phone, message){
  // phone should be international number without + and without spaces
  const cleaned = String(phone).replace(/\D/g,'');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

