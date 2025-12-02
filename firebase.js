/* ================================
   FIREBASE INITIALIZATION
   (Global Leaderboard Backend)
   ================================ */

// Import SDK modules via CDN (browser-safe)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, setDoc } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your Firebase Configuration (from Brandi)
const firebaseConfig = {
    apiKey: "AIzaSyA0y9RGv-lBEDUrHt4hmxlYp--Bll5SIbo",
    authDomain: "fire-and-ice-nursing-game.firebaseapp.com",
    projectId: "fire-and-ice-nursing-game",
    storageBucket: "fire-and-ice-nursing-game.firebasestorage.app",
    messagingSenderId: "842933205626",
    appId: "1:842933205626:web:5527fa29f6a155fd3459c3",
    measurementId: "G-LL9G5Y27MD"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Connect Firestore Database
const db = getFirestore(app);

// Export db so leaderboard.js and game.js can use it
export { db, collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, setDoc };
