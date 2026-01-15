/**
 * Browser Firebase client (Firestore)
 * Static HTML setup using ES Modules from Firebase CDN.
 *
 * You MUST paste your firebaseConfig values from:
 * Firebase Console → Project settings → Your apps → Web app
 * Docs: https://firebase.google.com/docs/web/setup  (don’t paste URL in your site)
 */

const FIREBASE_SDK_VERSION = "10.12.5"; // pin a version you’re using consistently

// NOTE: This file expects you to provide a global FIREBASE_CONFIG object.
// You will create it in: js/firebase/firebaseConfig.js (next file).

export async function getDb() {
  const [{ initializeApp }, { getFirestore }] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`)
  ]);

  if (!globalThis.FIREBASE_CONFIG) {
    throw new Error(
      "Missing FIREBASE_CONFIG. Create js/firebase/firebaseConfig.js and define globalThis.FIREBASE_CONFIG."
    );
  }

  // Avoid double-init
  if (!globalThis.__firebaseApp) {
    globalThis.__firebaseApp = initializeApp(globalThis.FIREBASE_CONFIG);
  }

  if (!globalThis.__firestoreDb) {
    globalThis.__firestoreDb = getFirestore(globalThis.__firebaseApp);
  }

  return globalThis.__firestoreDb;
}
