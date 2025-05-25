
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
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized with firebaseConfig.");
  } catch (e) {
    console.error("Error initializing Firebase app:", e);
    // In a client app, you might handle this more gracefully.
    throw new Error("Firebase app initialization failed.");
  }
} else {
  app = getApp();
  console.log("Firebase app already exists, getting instance.");
}

let db: Firestore;

// Attempt to initialize Firestore with specific settings.
// This check helps to avoid re-initializing if it's already done with compatible settings.
try {
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
  console.log("Firestore initialized with ignoreUndefinedProperties:true using initializeFirestore(app, {options}).");
} catch (e: any) {
  if (e.code === 'failed-precondition' && e.message.includes('already been called')) {
    console.warn("initializeFirestore() with options failed as it was already called. Attempting to get existing instance via getFirestore(app).");
    db = getFirestore(app); // Get the existing instance
  } else {
    console.error("Unexpected error during Firestore initialization with options:", e);
    console.warn("Falling back to basic getFirestore(app) due to an unexpected initialization error.");
    db = getFirestore(app); // Fallback to default initialization
  }
}

// Connect to emulator if configured
const isEmulatorEnabled = process.env.USE_FIRESTORE_EMULATOR === 'true';
const isDevelopment = process.env.NODE_ENV === 'development';
const isNodeEnvironment = typeof window === 'undefined';

if (isEmulatorEnabled && isDevelopment && isNodeEnvironment) {
    console.log("Attempting to connect to Firestore Emulator (config.ts for Node.js environment)...");
    try {
      if (db) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log("Firestore Emulator connected (config.ts for Node.js).");
      } else {
        console.error("Firestore instance (db) is undefined, cannot connect emulator.");
      }
    } catch (e: any) {
      if (e.code === 'failed-precondition' && e.message.includes('emulator has already been connected to')) {
        console.warn("Firestore Emulator was already connected.");
      } else if (e.code === 'failed-precondition') {
         console.warn("Firestore Emulator connection attempt failed (config.ts), possibly already connected or misconfigured:", e.message);
      } else {
        console.error("Error connecting to Firestore Emulator (config.ts):", e);
      }
    }
}

export { app, db };
