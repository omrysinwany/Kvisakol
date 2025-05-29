
// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("Firebase config.ts: Using projectId from env:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error("CRITICAL: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not defined in .env.local. Firebase will not initialize correctly.");
}


let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized with firebaseConfig.");
  } catch (e) {
    console.error("Error initializing Firebase app:", e);
    throw new Error("Firebase app initialization failed.");
  }
} else {
  app = getApp();
  console.log("Firebase app already exists, getting instance.");
}

let db: Firestore;

try {
  // Attempt to initialize Firestore with specific settings if not already initialized with these or similar settings.
  // The key is to be consistent with options across the app.
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    // Add other global Firestore settings here if needed, e.g., cacheSizeBytes
  });
  console.log("Firestore initialized or re-initialized with specified options (ignoreUndefinedProperties: true).");
} catch (e: any) {
  // This catch block handles cases where initializeFirestore might fail,
  // for example, if it was already called with incompatible options or other issues.
  if (e.code === 'failed-precondition') {
    console.warn(`initializeFirestore() failed with precondition error: ${e.message}. Attempting to get existing instance with getFirestore(app).`);
    db = getFirestore(app); // Fallback to getting the possibly already initialized instance.
  } else {
    console.error("Unexpected error during Firestore initialization:", e);
    console.warn("Falling back to basic getFirestore(app) due to an unexpected initialization error.");
    db = getFirestore(app); // Safest fallback
  }
}


// Connect to emulator if configured
const isEmulatorEnabled = process.env.USE_FIRESTORE_EMULATOR === 'true';
const isDevelopment = process.env.NODE_ENV === 'development';

if (isEmulatorEnabled && isDevelopment) {
    console.log("Attempting to connect to Firestore Emulator (config.ts)...");
    try {
      if (db) {
        // Check if emulator is already connected to this db instance to avoid error
        // This is a conceptual check; actual Firestore SDK doesn't expose a direct "isEmulatorConnected"
        // The try-catch for 'failed-precondition' for already connected emulator is the practical way.
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log("Firestore Emulator connection initiated (config.ts). If it was already connected, this might log a warning.");
      } else {
        console.error("Firestore instance (db) is undefined, cannot connect emulator.");
      }
    } catch (e: any) {
      if (e.code === 'failed-precondition' && e.message.includes('emulator has already been connected to')) {
        console.warn("Firestore Emulator was already connected for this db instance.");
      } else if (e.code === 'failed-precondition') {
         console.warn("Firestore Emulator connection attempt failed (config.ts), possibly already connected or misconfigured:", e.message);
      } else {
        console.error("Error connecting to Firestore Emulator (config.ts):", e);
      }
    }
}

export { app, db };
    