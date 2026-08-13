// provider.js — Firebase auth + upload + Firestore logic
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

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

// Auth state
onAuthStateChanged(auth, async (user)=>{
  if(user){
    // show dashboard
    signupForm.style.display='none';
    signinForm.style.display='none';
    dashboard.style.display='block';
    signOutBtn.style.display='inline-block';
    welcome.innerText = `Welcome, ${user.email}`;
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
    snap.forEach(docSnap=>{
      const data = docSnap.data();
      const id = docSnap.id;
      const item = document.createElement('div');
      item.className = 'upload-item';
      item.innerHTML = `
        <video src="${data.url}" controls preload="metadata"></video>
        <div style="flex:1">
          <strong>${escapeHtml(data.title || 'Untitled')}</strong>
          <div class="muted">${escapeHtml(data.category || '')} • ${data.ownerEmail || ''}</div>
          <div class="muted">${escapeHtml(data.description || '')}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn ghost" data-id="${id}" data-path="${data.storagePath}">Delete</button>
          <a class="btn" href="${data.url}" target="_blank" rel="noopener">Open</a>
        </div>
      `;
      uploadsList.appendChild(item);
    });

    // wire delete buttons
    document.querySelectorAll('.upload-item .btn.ghost').forEach(b=>{
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

