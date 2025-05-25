
// src/scripts/seed-firestore.ts
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' }); // Load environment variables from .env.local FIRST

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { placeholderProducts, placeholderOrders, placeholderAdminUsers } from '@/lib/placeholder-data';
import { getFirestore, initializeFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import type { CollectionReference } from 'firebase/firestore';
import type { Product, Order, AdminUser } from '@/lib/types';
import { collection, writeBatch, doc, Timestamp, getDocs, query, limit as firestoreLimit } from 'firebase/firestore';

async function seedCollection<T extends { id?: string }>(
  collectionName: string,
  db: Firestore, // Accept Firestore instance as argument
  data: T[],
  transform?: (item: T) => any
) {
  console.log(`Checking existing data in ${collectionName}...`);
  const collectionRef = collection(db, collectionName);

  const q = query(collectionRef, firestoreLimit(1));
  const existingDocsSnapshot = await getDocs(q);

  if (!existingDocsSnapshot.empty) {
    console.log(`${collectionName} collection is not empty. Skipping seeding to avoid duplicates. Please clear the collection in Firebase Console if you want to re-seed.`);
    return;
  }
  
  console.log(`${collectionName} collection is empty. Seeding ${data.length} items...`); 
  const batch = writeBatch(db);
  let count = 0;

  data.forEach((item) => { 
    // Use the item's id for the document ID if it exists, otherwise Firestore generates one.
    const docRef = item.id ? doc(db, collectionName, item.id) : doc(collectionRef);
    
    let dataToSet: any;
    if (transform) {
      dataToSet = transform(item);
    } else {
      // If item.id was used for docRef, we don't need to store it as a field.
      const { id, ...restOfItem } = item; 
      dataToSet = restOfItem;
    }
    batch.set(docRef, dataToSet);
    count++;
    if (count % 400 === 0) { 
      console.log(`Processed ${count} items for ${collectionName}...`);
    }
  });

  try {
    await batch.commit();
    console.log(`Successfully seeded ${count} items into ${collectionName} collection.`);
  } catch (error) {
    console.error(`Error seeding ${collectionName}:`, error);
  }
}

async function main() {
  console.log('Starting Firestore seeding process...');

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
      throw new Error("Firebase app initialization failed.");
    }
  } else {
    app = getApp();
    console.log("Firebase app already exists, getting instance.");
  }

  let db: Firestore;

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

  if (isEmulatorEnabled && isDevelopment && isNodeEnvironment && db) {
      console.log("Attempting to connect to Firestore Emulator (seed script)...");
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log("Firestore Emulator connected (seed script).");
      } catch (e: any) {
        if (!(e.code === 'failed-precondition' && e.message.includes('emulator has already been connected to'))) {
           console.error("Error connecting to Firestore Emulator (seed script):", e);
        } else {
           console.warn("Firestore Emulator was already connected.");
        }
      }
  }

  const envProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const sdkProjectId = app.options.projectId;

  console.log(`Project ID from .env.local (NEXT_PUBLIC_FIREBASE_PROJECT_ID): ${envProjectId}`);
  console.log(`Project ID from Firebase SDK (firebaseApp.options.projectId): ${sdkProjectId}`);

  if (!envProjectId) {
    console.error("Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in your .env.local file.");
    console.error("Please ensure your .env.local file is correctly configured with your Firebase project details.");
    process.exit(1);
  }

  if (envProjectId !== sdkProjectId) {
    console.warn(
      `Warning: Project ID mismatch detected. The script will use the SDK-initialized project ID: ${sdkProjectId} for Firestore operations. 
      Ensure this is the intended project. .env.local NEXT_PUBLIC_FIREBASE_PROJECT_ID is ${envProjectId}.`
    );
  }
  console.log(`Attempting to seed Firestore for project ID associated with the initialized Firebase app: ${sdkProjectId}`);


  await seedCollection<AdminUser>('adminUsers', db, placeholderAdminUsers, user => { // Pass db here
    const { id, ...userData } = user; 
    return userData;
  });

  await seedCollection<Product>('products', db, placeholderProducts, product => { // Pass db here
    const { id, ...productData } = product;
    return {
        ...productData,
        price: Number(productData.price),
        category: productData.category || '',
        dataAiHint: productData.dataAiHint || '',
        isActive: productData.isActive !== undefined ? productData.isActive : true, 
    };
  });

  await seedCollection<Order>('orders', db, placeholderOrders, order => { // Pass db here
    const { id, ...orderData } = order;
    return {
      ...orderData,
      orderTimestamp: order.orderTimestamp instanceof Date ? Timestamp.fromDate(order.orderTimestamp) : Timestamp.now(), 
      totalAmount: Number(order.totalAmount),
      customerNotes: orderData.customerNotes || undefined, 
      agentNotes: orderData.agentNotes || undefined, 
      isViewedByAgent: orderData.isViewedByAgent !== undefined ? orderData.isViewedByAgent : false,
    };
  });

  console.log('Firestore seeding process completed.');
}

main().catch((error) => {
    console.error("Seeding script failed with an unhandled error:", error);
    process.exit(1); 
});
