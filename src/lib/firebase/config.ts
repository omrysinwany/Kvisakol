
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
  // Initialize Firestore with specific options.
  // It's safe to call initializeFirestore multiple times if the options are identical.
  // The error "already been called with different options" happens if getFirestore()
  // is called first (initializing with defaults) and then initializeFirestore() is called with options.
  initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
  db = getFirestore(app);
  console.log("Firestore instance obtained/initialized with ignoreUndefinedProperties:true.");

  // Conditional connection to Firestore emulator
  // This should only be active if you intend to use the emulator.
  // The seeding script currently does not set USE_FIRESTORE_EMULATOR, so this block won't run for it.
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'development' && process.env.USE_FIRESTORE_EMULATOR === 'true') {
    console.log("Attempting to connect to Firestore Emulator...");
    try {
      connectFirestoreEmulator(db, 'localhost', 8080); // Default emulator port
      console.log("Firestore Emulator connected.");
    } catch (e: any) {
      // This specific error code means it's already connected to the emulator.
      if (e.code === 'failed-precondition' && e.message.includes('already has a an Bytes Entry Point connected to the Emulator')) {
        console.warn("Firestore Emulator was already connected.");
      } else {
        console.error("Error connecting to Firestore Emulator:", e);
        // Depending on your setup, you might want to handle this error differently.
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
  // For the seeding script, we let it attempt to proceed. It will fail later if db is not usable.
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
