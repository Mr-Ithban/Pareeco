/* =========================================================
   firebase-config.js — PAREECO Firebase Initialization
   Firebase Modular SDK v10+
   =========================================================
   HOW TO FILL THIS IN:
   1. Go to https://console.firebase.google.com
   2. Open your project → Project Settings (gear icon)
   3. Scroll to "Your apps" → Select your Web App
   4. Copy the firebaseConfig object and paste the values below
   ========================================================= */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// ⚠️ Replace each value with your own Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyCewZx5_R1pD4LrTgO_96L1Vk-H1Ikyolg",
    authDomain: "pareeco-c0cc3.firebaseapp.com",
    projectId: "pareeco-c0cc3",
    storageBucket: "pareeco-c0cc3.firebasestorage.app",
    messagingSenderId: "160427063322",
    appId: "1:160427063322:web:0181d6a68f7298b36db9a3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
