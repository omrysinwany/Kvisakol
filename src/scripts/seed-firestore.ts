
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
    // Firestore can auto-generate IDs if we don't provide one.
    // However, our placeholder data has IDs, so we'll use them.
    // If your placeholder IDs are not unique or you prefer Firestore IDs, adjust accordingly.
    const docId = item.id || doc(collectionRef).id; // Use placeholder ID or generate if missing
    const docRef = doc(db, collectionName, docId);
    
    const dataToSet = transform ? transform(item) : { ...item };
    if (dataToSet.id) { // Remove id from the data being set if it was used for docId
        delete dataToSet.id;
    }

    batch.set(docRef, dataToSet);
    count++;
    if (count % 400 === 0) { // Firestore batch limit is 500 operations
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

  // Seed Admin Users
  // Note: Passwords are in plaintext (passwordHash field). THIS IS NOT SECURE FOR PRODUCTION.
  // Use Firebase Authentication for real user management.
  await seedCollection<AdminUser>('adminUsers', placeholderAdminUsers, user => {
    const { id, ...userData } = user; // Ensure id is not part of the document data if used as docId
    return userData;
  });

  // Seed Products
  await seedCollection<Product>('products', placeholderProducts, product => {
    const { id, ...productData } = product;
    return {
        ...productData,
        price: Number(productData.price) // Ensure price is a number
    };
  });

  // Seed Orders
  // Convert orderTimestamp to Firestore Timestamp
  await seedCollection<Order>('orders', placeholderOrders, order => {
    const { id, orderTimestamp, ...orderData } = order;
    return {
      ...orderData,
      orderTimestamp: orderTimestamp instanceof Date ? Timestamp.fromDate(orderTimestamp) : Timestamp.now(), // Convert JS Date to Firestore Timestamp
      totalAmount: Number(orderData.totalAmount) // Ensure totalAmount is a number
    };
  });

  console.log('Firestore seeding process completed.');
}

main().catch(console.error);
