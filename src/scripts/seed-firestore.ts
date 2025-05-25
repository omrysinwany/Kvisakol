
// src/scripts/seed-firestore.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Load environment variables from .env.local FIRST

import { db, app as firebaseApp } from '@/lib/firebase/config'; // db is imported, also import app
import { placeholderProducts, placeholderOrders, placeholderAdminUsers } from '@/lib/placeholder-data';
import type { Product, Order, AdminUser } from '@/lib/types';
import { collection, writeBatch, doc, Timestamp, getDocs, query } from 'firebase/firestore';

async function seedCollection<T extends { id?: string }>(
  collectionName: string,
  data: T[],
  transform?: (item: T) => any
) {
  console.log(`Checking existing data in ${collectionName}...`);
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef);
  const existingDocsSnapshot = await getDocs(q);

  if (!existingDocsSnapshot.empty) {
    console.log(`${collectionName} collection is not empty. Skipping seeding to avoid duplicates. Please clear the collection in Firebase Console if you want to re-seed.`);
    return;
  }
  
  console.log(`Seeding ${collectionName} collection...`);
  const batch = writeBatch(db);
  let count = 0;

  data.forEach((item) => {
    const docId = item.id || doc(collectionRef).id; 
    const docRef = doc(db, collectionName, docId);
    
    let dataToSet: any;
    if (transform) {
      dataToSet = transform(item);
    } else {
      if (item.id) {
        const { id, ...restOfItem } = item;
        dataToSet = restOfItem;
      } else {
        dataToSet = { ...item }; 
      }
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

  if (!db) {
    console.error("Firestore database instance (db) is not available. Exiting seed script.");
    console.error("This might be due to an issue in Firebase config or initialization.");
    process.exit(1);
  }
  
  const envProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const sdkProjectId = firebaseApp.options.projectId;

  console.log(`Project ID from .env.local: ${envProjectId}`);
  console.log(`Project ID from Firebase SDK: ${sdkProjectId}`);

  if (!envProjectId) {
    console.error("Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in your .env.local file.");
    console.error("Please ensure your .env.local file is correctly configured with your Firebase project details.");
    process.exit(1);
  }

  if (envProjectId !== sdkProjectId) {
    console.error(`CRITICAL ERROR: Project ID mismatch!`);
    console.error(`.env.local NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${envProjectId}`);
    console.error(`Firebase SDK app.options.projectId: ${sdkProjectId}`);
    console.error("Ensure these values match EXACTLY with your Firebase project ID in the Firebase Console.");
    process.exit(1);
  }
  console.log(`Confirmed project ID for seeding: ${sdkProjectId}`);


  await seedCollection<AdminUser>('adminUsers', placeholderAdminUsers, user => {
    const { id, ...userData } = user; 
    return userData;
  });

  await seedCollection<Product>('products', placeholderProducts, product => {
    const { id, ...productData } = product;
    return {
        ...productData,
        price: Number(productData.price),
        category: productData.category || '',
        dataAiHint: productData.dataAiHint || '',
        isActive: productData.isActive !== undefined ? productData.isActive : true,
    };
  });

  await seedCollection<Order>('orders', placeholderOrders, order => {
    const { id, ...orderData } = order;
    return {
      ...orderData,
      orderTimestamp: order.orderTimestamp instanceof Date ? Timestamp.fromDate(order.orderTimestamp) : Timestamp.now(), 
      totalAmount: Number(order.totalAmount),
      customerNotes: orderData.customerNotes || undefined, // Will be ignored if ignoreUndefinedProperties is true
      agentNotes: orderData.agentNotes || undefined, // Will be ignored
      isViewedByAgent: orderData.isViewedByAgent !== undefined ? orderData.isViewedByAgent : false,
    };
  });

  console.log('Firestore seeding process completed.');
}

main().catch((error) => {
    console.error("Seeding script failed:", error);
    process.exit(1); 
});
