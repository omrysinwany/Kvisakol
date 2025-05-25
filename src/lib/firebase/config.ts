
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized.");
} else {
  app = getApp();
  console.log("Firebase app already exists, getting instance.");
}

let db: Firestore;

try {
  // Attempt to get the existing Firestore instance first
  db = getFirestore(app);
  console.log("Firestore instance obtained via getFirestore(app).");

  // Try to initialize with options only if it hasn't been initialized with these options before.
  // This is a bit tricky to detect perfectly, so we rely on Firestore's own error handling.
  try {
    initializeFirestore(app, {
      ignoreUndefinedProperties: true,
    });
    // If initializeFirestore didn't throw, we re-assign db to ensure we have the instance with these options.
    db = getFirestore(app); 
    console.log("Firestore re-initialized/confirmed with ignoreUndefinedProperties:true.");
  } catch (e: any) {
    if (e.code === 'failed-precondition' && e.message.includes('already been called')) {
      console.warn("Firestore was already initialized. Proceeding with existing instance. Ensure options are compatible if set elsewhere.");
    } else {
      // If it's a different error, re-throw it.
      throw e;
    }
  }

  // Emulator connection (only in development and if flag is set)
  // Check if this code is running in a Node.js environment (like the seed script) or browser
  const isNodeEnvironment = typeof window === 'undefined';
  if (isNodeEnvironment && process.env.NODE_ENV === 'development' && process.env.USE_FIRESTORE_EMULATOR === 'true') {
    console.log("Attempting to connect to Firestore Emulator (config.ts)...");
    try {
      // For scripts, it's generally safer to connect every time.
      // For client-side, this might cause issues if already connected.
      connectFirestoreEmulator(db, 'localhost', 8080); 
      console.log("Firestore Emulator connected (config.ts).");
    } catch (e: any) {
      if (e.code === 'failed-precondition') {
        console.warn("Firestore Emulator connection attempt failed (config.ts), possibly already connected or misconfigured:", e.message);
      } else {
        console.error("Error connecting to Firestore Emulator (config.ts):", e);
      }
    }
  }
} catch (e: any) {
  console.error("Critical error during Firestore initialization in config.ts:", e);
  // Fallback if any error occurs during the more complex initialization
  if (!db!) { // db might still be undefined if initializeApp itself failed, though less likely here
      console.warn("Falling back to basic getFirestore() due to initialization error.");
      db = getFirestore(app);
  }
}


// For debugging in client/dev environments
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log("Firebase Config Loaded in Client (config.ts):", {
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export { app, db };
