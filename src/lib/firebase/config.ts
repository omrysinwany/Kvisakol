
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from "firebase/firestore";

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
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized.");
} else {
  app = getApp();
  console.log("Firebase app already exists.");
}

let db;
try {
    db = getFirestore(app);
    // Conditional connection to Firestore emulator if running in development
    // and a specific environment variable is set (e.g., for seeding script)
    if (process.env.NODE_ENV === 'development' && process.env.USE_FIRESTORE_EMULATOR === 'true' && typeof window === 'undefined') {
      // Ensure this only runs in Node.js environment (like the seeding script)
      // and not in the browser where connectFirestoreEmulator might behave differently or error.
      console.log("Connecting to Firestore Emulator for seeding script...");
      connectFirestoreEmulator(db, 'localhost', 8080); // Default emulator port
    } else {
       // For client-side or when not using emulator, ensure it's initialized
       // This might be redundant if getFirestore handles it, but good for clarity
       initializeFirestore(app, {
         ignoreUndefinedProperties: true, // Recommended for Firestore
       });
    }
    console.log("Firestore instance created/retrieved.");

} catch (e) {
    console.error("Error initializing Firestore:", e);
    // Fallback or error handling
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') { // Check if in client or dev to initialize
        try {
            initializeFirestore(app, {ignoreUndefinedProperties: true});
            db = getFirestore(app);
            console.log("Firestore initialized after initial error.");
        } catch (initError) {
            console.error("Failed to initialize Firestore even after retry:", initError);
            // Depending on your app's needs, you might want to throw here or handle it differently
        }
    } else {
        // If not client and not dev, and there's an error, rethrow or log critically
        console.error("Critical error: Firestore could not be initialized in a non-dev/non-client environment.");
    }
}


if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log("Firebase Config Loaded in Client:", {
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}


export { app, db };
