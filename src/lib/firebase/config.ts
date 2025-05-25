
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

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
  if (typeof window !== 'undefined') {
    // For client-side Firestore, ensure it's initialized after the app.
    // For server-side (e.g. Genkit, not used here for Firestore access directly), initialization might differ.
    initializeFirestore(app, {
      ignoreUndefinedProperties: true, // Recommended for Firestore
    });
  }
  console.log("Firebase initialized with Firestore");
} else {
  app = getApp();
  // Ensure Firestore is initialized if app already exists (e.g., HMR)
  // This check might be redundant if getFirestore(app) handles it, but safe to include.
  try {
    getFirestore(app);
  } catch (e) {
    if (typeof window !== 'undefined') {
        initializeFirestore(app, {ignoreUndefinedProperties: true});
        console.log("Firestore initialized on existing app instance.");
    }
  }
  console.log("Firebase app already exists");
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log("Firebase Config Loaded in Client:", {
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore(app);
console.log("Firestore instance created/retrieved");

export { app, db };
