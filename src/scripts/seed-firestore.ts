
// src/scripts/seed-firestore.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Load environment variables from .env.local

import { db } from '@/lib/firebase/config';
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
    const docId = item.id || doc(collectionRef).id; // If item.id is undefined, a new ID is generated
    const docRef = doc(db, collectionName, docId);
    
    let dataToSet: any;
    if (transform) {
      dataToSet = transform(item); // The transform function is responsible for ensuring 'id' is handled correctly
    } else {
      // If no transform, and item.id was used for docId, remove it from the data to be set.
      if (item.id) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error("Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in your .env.local file.");
    console.error("Please ensure your .env.local file is correctly configured with your Firebase project details.");
    return;
  }
  console.log(`Seeding Firestore for project ID: ${projectId}`);


  await seedCollection<AdminUser>('adminUsers', placeholderAdminUsers, user => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...userData } = user; 
    return userData;
  });

  await seedCollection<Product>('products', placeholderProducts, product => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...productData } = product;
    return {
        ...productData,
        price: Number(productData.price) 
    };
  });

  await seedCollection<Order>('orders', placeholderOrders, order => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...orderData } = order; // Destructure id so it's not in orderData
    return {
      ...orderData,
      orderTimestamp: order.orderTimestamp instanceof Date ? Timestamp.fromDate(order.orderTimestamp) : Timestamp.now(), 
      totalAmount: Number(order.totalAmount) 
    };
  });

  console.log('Firestore seeding process completed.');
}

main().catch((error) => {
    console.error("Seeding script failed:", error);
    process.exit(1); // Exit with error code if main function fails
});
