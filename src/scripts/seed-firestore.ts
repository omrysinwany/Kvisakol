
// src/scripts/seed-firestore.ts
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
    const docId = item.id || doc(collectionRef).id; 
    const docRef = doc(db, collectionName, docId);
    
    const dataToSet = transform ? transform(item) : { ...item };
    if (item.id && dataToSet.id) { // Ensure id from item is used for docId, not as a field if it's the same
        delete dataToSet.id;
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
    const { id, ...userData } = user; 
    return userData;
  });

  await seedCollection<Product>('products', placeholderProducts, product => {
    const { id, ...productData } = product;
    return {
        ...productData,
        price: Number(productData.price) 
    };
  });

  await seedCollection<Order>('orders', placeholderOrders, order => {
    const { id, orderTimestamp, ...orderData } = order;
    return {
      ...orderData,
      orderTimestamp: orderTimestamp instanceof Date ? Timestamp.fromDate(orderTimestamp) : Timestamp.now(), 
      totalAmount: Number(orderData.totalAmount) 
    };
  });

  console.log('Firestore seeding process completed.');
}

main().catch((error) => {
    console.error("Seeding script failed:", error);
    process.exit(1); // Exit with error code if main function fails
});
