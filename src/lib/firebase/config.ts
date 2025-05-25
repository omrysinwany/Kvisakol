
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

// Check if Firestore has already been initialized to prevent errors.
// This can happen in environments like Next.js with hot-reloading or when scripts also init Firebase.
try {
  db = getFirestore(app);
  // Attempt to initialize with specific options only if it hasn't been initialized with them already.
  // Firestore throws an error if initializeFirestore is called with different options after getFirestore() or
  // if initializeFirestore is called multiple times with different options.
  // We will initialize it with options. If it fails because it was already initialized (possibly with defaults),
  // we catch that specific error and proceed, assuming the existing instance is what we want or good enough.
  try {
    initializeFirestore(app, {
      ignoreUndefinedProperties: true,
    });
    db = getFirestore(app); // Re-assign db after potential re-initialization with options
    console.log("Firestore instance obtained/initialized with ignoreUndefinedProperties:true.");
  } catch (e: any) {
    if (e.code === 'failed-precondition' && e.message.includes('already been called')) {
      console.warn("Firestore was already initialized. Proceeding with existing instance. Ensure options are compatible if set elsewhere.");
      // db is already assigned from the first getFirestore(app) call
    } else {
      // Different error, re-throw or handle as critical
      throw e;
    }
  }

  // Conditional connection to Firestore emulator
  // This should only be active if you intend to use the emulator.
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'development' && process.env.USE_FIRESTORE_EMULATOR === 'true') {
    console.log("Attempting to connect to Firestore Emulator...");
    try {
      connectFirestoreEmulator(db, 'localhost', 8080); // Default emulator port
      console.log("Firestore Emulator connected.");
    } catch (e: any) {
      // This specific error code means it's already connected to the emulator.
      if (e.code === 'failed-precondition') {
        console.warn("Firestore Emulator connection attempt failed, possibly already connected or misconfigured:", e.message);
      } else {
        console.error("Error connecting to Firestore Emulator:", e);
      }
    }
  }
} catch (e: any) {
  console.error("Critical error during Firestore initialization in config.ts:", e);
  // Fallback if the above initialization fails for an unexpected reason.
  if (!db!) { // Check if db is still unassigned
      console.warn("Falling back to basic getFirestore() due to initialization error.");
      db = getFirestore(app);
  }
}


// For debugging in client/dev environments
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log("Firebase Config Loaded in Client:", {
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export { app, db };
