
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
  console.log("Firebase app initialized using firebaseConfig.");
} else {
  app = getApp();
  console.log("Firebase app already exists, getting instance.");
}

let db: Firestore;

try {
  // Attempt to initialize Firestore with specific settings.
  // This should be the first effective Firestore-related call for 'app' that sets configurations.
  // initializeFirestore returns the Firestore instance.
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
  console.log("Firestore initialized with ignoreUndefinedProperties:true using initializeFirestore().");
} catch (e: any) {
  if (e.code === 'failed-precondition' && e.message.includes('already been called')) {
    // This means Firestore was already initialized, possibly by getFirestore() directly elsewhere
    // or by a previous initializeFirestore() call. We'll try to get the existing instance.
    // It's crucial that the initial call used compatible settings.
    console.warn("Firestore was already initialized. Getting existing instance. Ensure initial options were compatible.");
    db = getFirestore(app);
  } else {
    console.error("Critical error during Firestore initialization:", e);
    // Fallback: get a default Firestore instance
    console.warn("Falling back to basic getFirestore() due to an unexpected initialization error.");
    db = getFirestore(app);
  }
}

// Connect to emulator if configured
const isNodeEnvironment = typeof window === 'undefined';
if (isNodeEnvironment && process.env.NODE_ENV === 'development' && process.env.USE_FIRESTORE_EMULATOR === 'true') {
    console.log("Attempting to connect to Firestore Emulator (config.ts)...");
    try {
      // Ensure db is defined before trying to connect emulator
      if (db) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log("Firestore Emulator connected (config.ts).");
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

// For debugging in client/dev environments
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log("Firebase Config Loaded in Client (config.ts):", {
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export { app, db };
