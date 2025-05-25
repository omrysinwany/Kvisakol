
// src/scripts/seed-firestore.ts
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' }); // Load environment variables from .env.local FIRST

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { placeholderProducts, placeholderOrders, placeholderAdminUsers } from '@/lib/placeholder-data';
import { getFirestore, initializeFirestore, connectFirestoreEmulator, type Firestore, collection, doc, writeBatch, Timestamp, getDocs, query, limit as firestoreLimit, setDoc } from "firebase/firestore";
import type { Product, Order, AdminUser, CustomerSummary } from '@/lib/types';


// Initialize Firebase and Firestore
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized for seeding.");
  } catch (e) {
    console.error("Error initializing Firebase app for seeding:", e);
    process.exit(1);
  }
} else {
  app = getApp();
  console.log("Firebase app already exists for seeding, getting instance.");
}

let db: Firestore;
try {
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
  console.log("Firestore initialized for seeding with ignoreUndefinedProperties:true.");
} catch (e: any) {
  if (e.code === 'failed-precondition' && e.message.includes('initializeFirestore() has already been called')) {
    console.warn("Firestore was already initialized. Proceeding with existing instance. Ensure options are compatible if set elsewhere.");
    db = getFirestore(app);
  } else {
    console.error("Unexpected error during Firestore initialization for seeding with options:", e);
    console.warn("Falling back to basic getFirestore(app) for seeding.");
    db = getFirestore(app);
  }
}


const isEmulatorEnabled = process.env.USE_FIRESTORE_EMULATOR === 'true';
const isDevelopment = process.env.NODE_ENV === 'development';

if (isEmulatorEnabled && isDevelopment && db) {
  console.log("Attempting to connect to Firestore Emulator (seed script)...");
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log("Firestore Emulator connected (seed script).");
  } catch (e: any) {
    if (e.code === 'failed-precondition' && e.message.includes('emulator has already been connected')) {
      console.warn("Firestore Emulator was already connected for this db instance (seed script).");
    } else {
      console.error("Error connecting to Firestore Emulator (seed script):", e);
    }
  }
}


async function seedCollection<T extends { id?: string }>(
  collectionName: string,
  data: T[],
  transform?: (item: T) => any,
  idField?: keyof T
) {
  console.log(`Checking existing data in ${collectionName}...`);
  const collectionRef = collection(db, collectionName);

  const q = query(collectionRef, firestoreLimit(1));
  const existingDocsSnapshot = await getDocs(q);

  if (!existingDocsSnapshot.empty) {
    console.log(`${collectionName} collection is not empty. Skipping seeding for this collection to avoid duplicates.`);
    return;
  }

  console.log(`${collectionName} collection is empty. Seeding ${data.length} items...`);
  const batch = writeBatch(db);
  let count = 0;

  data.forEach((item) => {
    const docId = idField ? String(item[idField]) : item.id;

    if (!docId) {
        console.warn(`Item in ${collectionName} is missing an ID (original ID field: ${String(idField)}). Letting Firestore generate ID.`);
        const newDocRef = doc(collectionRef); // Let Firestore generate ID
        let dataToSet: any;
        if (transform) {
          dataToSet = transform(item);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...restOfItem } = item;
          dataToSet = restOfItem;
        }
        batch.set(newDocRef, dataToSet);

    } else {
        const docRef = doc(db, collectionName, docId);
        let dataToSet: any;
        if (transform) {
          dataToSet = transform(item);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...restOfItem } = item;
          dataToSet = restOfItem;
        }
        batch.set(docRef, dataToSet);
    }

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

async function seedCustomersCollection() {
    const collectionName = 'customers';
    console.log(`Checking existing data in ${collectionName}...`);
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, firestoreLimit(1));
    const existingDocsSnapshot = await getDocs(q);

    if (!existingDocsSnapshot.empty) {
      console.log(`${collectionName} collection is not empty. Skipping seeding for this collection.`);
      return;
    }
    console.log(`${collectionName} collection is empty. Calculating and seeding customers...`);

    const customerDataMap = new Map<string, CustomerSummary>();

    // Sort orders by timestamp to correctly determine firstOrderDate and latestAddress/name
    const sortedOrders = [...placeholderOrders].sort((a, b) =>
        new Date(a.orderTimestamp).getTime() - new Date(b.orderTimestamp).getTime()
    );

    for (const order of sortedOrders) {
        const phone = order.customerPhone;
        if (!phone || typeof phone !== 'string' || phone.trim() === '') {
            console.warn("Order found without customerPhone during customer seeding. Skipping this order for customer summary:", order.id);
            continue;
        }

        const orderTimestamp = order.orderTimestamp instanceof Date ? Timestamp.fromDate(order.orderTimestamp) : Timestamp.fromDate(new Date(order.orderTimestamp));

        if (!customerDataMap.has(phone)) {
            customerDataMap.set(phone, {
                id: phone, // Phone number is the ID
                phone: phone,
                name: order.customerName, // Name from the first order
                firstOrderDate: orderTimestamp.toDate(),
                lastOrderDate: orderTimestamp.toDate(),
                totalOrders: 0,
                totalSpent: 0,
                latestAddress: order.customerAddress,
            });
        }
        const summary = customerDataMap.get(phone)!;
        summary.totalOrders += 1;
        summary.totalSpent += order.totalAmount;
        // Update last order date and address with each subsequent order for this customer
        if (orderTimestamp.toDate() > new Date(summary.lastOrderDate)) {
            summary.lastOrderDate = orderTimestamp.toDate();
            summary.latestAddress = order.customerAddress;
            // Do NOT update name here, keep the name from the first order.
        }
    }

    const batch = writeBatch(db);
    let count = 0;
    customerDataMap.forEach((customerSummary) => {
        const { id, ...customerDataFields } = customerSummary; // id is the phone, which is the doc ID
        const dataToSet = {
            ...customerDataFields,
            // Ensure dates are Timestamps
            firstOrderDate: customerSummary.firstOrderDate ? Timestamp.fromDate(new Date(customerSummary.firstOrderDate)) : null,
            lastOrderDate: Timestamp.fromDate(new Date(customerSummary.lastOrderDate)),
        };
        const customerDocRef = doc(db, 'customers', id); // Use phone (id) as document ID
        batch.set(customerDocRef, dataToSet);
        count++;
    });

    try {
        await batch.commit();
        console.log(`Successfully seeded ${count} customers into ${collectionName} collection.`);
    } catch (error) {
        console.error(`Error seeding ${collectionName}:`, error);
    }
}


async function main() {
  console.log('Starting Firestore seeding process...');
  const envProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const sdkProjectId = app?.options?.projectId;

  console.log(`Project ID from .env.local (NEXT_PUBLIC_FIREBASE_PROJECT_ID): ${envProjectId}`);
  console.log(`Project ID from Firebase SDK (app.options.projectId): ${sdkProjectId}`);

  if (!envProjectId) {
    console.error("Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in your .env.local file.");
    console.error("Please ensure your .env.local file is correctly configured with your Firebase project details.");
    process.exit(1);
  }
  if (envProjectId !== sdkProjectId) {
    console.warn(
      `Warning: Project ID mismatch. Script will use SDK-initialized project ID: ${sdkProjectId}. .env.local: ${envProjectId}. Ensure this is correct.`
    );
  }
  console.log(`Seeding Firestore for project ID: ${sdkProjectId}`);

  await seedCollection<AdminUser>('adminUsers', placeholderAdminUsers, user => {
    const { id, ...userData } = user;
    return userData;
  }, 'id');

  await seedCollection<Product>('products', placeholderProducts, product => {
    const { id, ...productData } = product;
    return {
        ...productData,
        price: Number(productData.price),
        category: productData.category || '',
        dataAiHint: productData.dataAiHint || '',
        isActive: productData.isActive !== undefined ? productData.isActive : true,
    };
  }, 'id');

  await seedCollection<Order>('orders', placeholderOrders, order => {
    const { id, ...orderData } = order;
    return {
      ...orderData,
      customerPhone: orderData.customerPhone || '',
      orderTimestamp: order.orderTimestamp instanceof Date ? Timestamp.fromDate(order.orderTimestamp) : Timestamp.fromDate(new Date(order.orderTimestamp)),
      totalAmount: Number(order.totalAmount),
      customerNotes: orderData.customerNotes || '',
      agentNotes: orderData.agentNotes || '',
      isViewedByAgent: orderData.isViewedByAgent !== undefined ? orderData.isViewedByAgent : false,
    };
  }, 'id');

  await seedCustomersCollection();

  console.log('Firestore seeding process completed.');
}

main().catch((error) => {
    console.error("Seeding script failed with an unhandled error:", error);
    process.exit(1);
});
