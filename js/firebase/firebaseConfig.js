globalThis.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAkH-JToTGUFOBUryN78EVdgdFylkns1bg",
  authDomain: "p-portfolio-1a2ac.firebaseapp.com",
  projectId: "p-portfolio-1a2ac",
  storageBucket: "p-portfolio-1a2ac.firebasestorage.app",
  messagingSenderId: "1072757497646",
  appId: "1:1072757497646:web:61a1b022de3fe8df2864bf",
};

const cfg = globalThis.FIREBASE_CONFIG;
const missing = Object.entries(cfg).filter(([_, v]) => !v || String(v).includes("PASTE_ME"));
if (missing.length) {
  console.warn(
    "Firebase config not filled. Update js/firebase/firebaseConfig.js. Missing:",
    missing.map(([k]) => k)
  );
}
