
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, connectFirestoreEmulator, Firestore } from "firebase/firestore";

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
  db = getFirestore(app);
  try {
    initializeFirestore(app, {
      ignoreUndefinedProperties: true,
    });
    db = getFirestore(app); 
    console.log("Firestore instance obtained/initialized with ignoreUndefinedProperties:true.");
  } catch (e: any) {
    if (e.code === 'failed-precondition' && e.message.includes('already been called')) {
      console.warn("Firestore was already initialized. Proceeding with existing instance. Ensure options are compatible if set elsewhere.");
    } else {
      throw e;
    }
  }

  if (process.env.NODE_ENV === 'development' && process.env.USE_FIRESTORE_EMULATOR === 'true') {
    console.log("Attempting to connect to Firestore Emulator (config.ts)...");
    try {
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
  if (!db!) { 
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
