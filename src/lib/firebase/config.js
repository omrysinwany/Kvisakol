"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.app = void 0;
// src/lib/firebase/config.ts
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
var firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};
console.log("Firebase config.ts: Using projectId from env:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error("CRITICAL: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not defined in .env.local. Firebase will not initialize correctly.");
}
var app;
if (!(0, app_1.getApps)().length) {
    try {
        exports.app = app = (0, app_1.initializeApp)(firebaseConfig);
        console.log("Firebase app initialized with firebaseConfig.");
    }
    catch (e) {
        console.error("Error initializing Firebase app:", e);
        throw new Error("Firebase app initialization failed.");
    }
}
else {
    exports.app = app = (0, app_1.getApp)();
    console.log("Firebase app already exists, getting instance.");
}
var db;
try {
    // Attempt to initialize Firestore with specific settings if not already initialized with these or similar settings.
    // The key is to be consistent with options across the app.
    exports.db = db = (0, firestore_1.initializeFirestore)(app, {
        ignoreUndefinedProperties: true,
        // Add other global Firestore settings here if needed, e.g., cacheSizeBytes
    });
    console.log("Firestore initialized or re-initialized with specified options (ignoreUndefinedProperties: true).");
}
catch (e) {
    // This catch block handles cases where initializeFirestore might fail,
    // for example, if it was already called with incompatible options or other issues.
    if (e.code === 'failed-precondition') {
        console.warn("initializeFirestore() failed with precondition error: ".concat(e.message, ". Attempting to get existing instance with getFirestore(app)."));
        exports.db = db = (0, firestore_1.getFirestore)(app); // Fallback to getting the possibly already initialized instance.
    }
    else {
        console.error("Unexpected error during Firestore initialization:", e);
        console.warn("Falling back to basic getFirestore(app) due to an unexpected initialization error.");
        exports.db = db = (0, firestore_1.getFirestore)(app); // Safest fallback
    }
}
// Connect to emulator if configured
var isEmulatorEnabled = process.env.USE_FIRESTORE_EMULATOR === 'true';
var isDevelopment = process.env.NODE_ENV === 'development';
if (isEmulatorEnabled && isDevelopment) {
    console.log("Attempting to connect to Firestore Emulator (config.ts)...");
    try {
        if (db) {
            // Check if emulator is already connected to this db instance to avoid error
            // This is a conceptual check; actual Firestore SDK doesn't expose a direct "isEmulatorConnected"
            // The try-catch for 'failed-precondition' for already connected emulator is the practical way.
            (0, firestore_1.connectFirestoreEmulator)(db, 'localhost', 8080);
            console.log("Firestore Emulator connection initiated (config.ts). If it was already connected, this might log a warning.");
        }
        else {
            console.error("Firestore instance (db) is undefined, cannot connect emulator.");
        }
    }
    catch (e) {
        if (e.code === 'failed-precondition' && e.message.includes('emulator has already been connected to')) {
            console.warn("Firestore Emulator was already connected for this db instance.");
        }
        else if (e.code === 'failed-precondition') {
            console.warn("Firestore Emulator connection attempt failed (config.ts), possibly already connected or misconfigured:", e.message);
        }
        else {
            console.error("Error connecting to Firestore Emulator (config.ts):", e);
        }
    }
}
