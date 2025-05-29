
// This script is not automatically executed by the app.
// You need to run it manually via `npm run db:seed` (or similar)
// after setting up your .env.local file with Firebase credentials.
// It's intended for one-time seeding or for resetting data during development.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Load environment variables from .env.local

import { db } from '../lib/firebase/config'; // Adjust path as necessary
import { collection, writeBatch, getDocs, query, Timestamp, doc } from 'firebase/firestore';
import {
  placeholderProducts,
  placeholderOrders,
  placeholderAdminUsers,
} from '../lib/placeholder-data'; // Adjust path as necessary
import type { Product, Order, AdminUser, CustomerSummary } from '../lib/types';

console.log('Starting Firestore seeding process...');

if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error(
    'Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in your .env.local file.'
  );
  console.error(
    'Please ensure your .env.local file is correctly configured with your Firebase project details.'
  );
  process.exit(1); // Exit if project ID is not set
}
console.log(
  'Seeding Firestore for project ID:',
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);
if (
  db.app.options.projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
) {
  console.warn(
    `Mismatch: Firestore SDK initialized with projectId '${db.app.options.projectId}', but .env.local has '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}'. Using SDK's projectId.`
  );
}

async function seedCollection<T extends { id?: string }>(
  collectionName: string,
  data: T[],
  transform?: (item: T) => any
) {
  console.log(`Checking existing data in ${collectionName}...`);
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(query(collectionRef));

  if (!snapshot.empty) {
    console.log(
      `${collectionName} collection is not empty. Skipping seeding for this collection to avoid duplicates/overwrites.`
    );
    return;
  }

  console.log(`Seeding ${collectionName} collection...`);
  const batch = writeBatch(db);
  let count = 0;

  data.forEach((item) => {
    const docData = transform ? transform(item) : { ...item };
    // Firestore will auto-generate an ID if item.id is undefined or not part of docData.
    // If item.id is present and we want to use it as the document ID:
    let docRef;
    if (item.id) {
      docRef = doc(collectionRef, item.id);
      // If using item.id as document ID, don't also store it as a field unless intended.
      // delete docData.id; // Optional: remove id from fields if it's the doc ID
    } else {
      docRef = doc(collectionRef); // Let Firestore generate ID
    }
    batch.set(docRef, docData);
    count++;
    if (count % 400 === 0) { // Firestore batch limit is 500 writes
      console.log(`Committing batch of ${count} for ${collectionName}...`);
      batch.commit().then(() => console.log('Batch committed.'));
      // batch = writeBatch(db); // Re-initialize batch - Not strictly necessary if we commit and create new one for next iteration
    }
  });

  try {
    await batch.commit();
    console.log(
      `Successfully seeded ${count} documents into ${collectionName} collection.`
    );
  } catch (error) {
    console.error(`Error seeding ${collectionName}:`, error);
  }
}

async function seedCustomersCollection() {
  console.log("Checking existing data in customers...");
  const customersCollectionRef = collection(db, "customers");
  const snapshot = await getDocs(query(customersCollectionRef));

  if (!snapshot.empty) {
    console.log(
      "customers collection is not empty. Skipping seeding to avoid duplicates/overwrites."
    );
    return;
  }

  console.log("Preparing customer summaries from placeholderOrders...");
  const customerMap: Map<string, Partial<CustomerSummary> & { orders: Order[] }> = new Map();

  // Sort orders by timestamp to correctly determine firstOrderDate and latest details
  const sortedOrders = [...placeholderOrders].sort(
    (a, b) => new Date(a.orderTimestamp).getTime() - new Date(b.orderTimestamp).getTime()
  );

  sortedOrders.forEach((order) => {
    const phone = String(order.customerPhone || '').trim();
    if (!phone) return;

    if (!customerMap.has(phone)) {
      customerMap.set(phone, {
        id: phone,
        phone: phone,
        name: order.customerName, // Name from the first order
        firstOrderDate: order.orderTimestamp,
        lastOrderDate: order.orderTimestamp,
        totalOrders: 0,
        totalSpent: 0,
        latestAddress: order.customerAddress,
        generalAgentNotes: '',
        orders: [],
      });
    }

    const customerEntry = customerMap.get(phone)!;
    customerEntry.orders.push(order);
    customerEntry.lastOrderDate = order.orderTimestamp; // Update with each newer order
    customerEntry.latestAddress = order.customerAddress; // Update with each newer order
    // If we decide to update name with latest order: customerEntry.name = order.customerName;
  });

  const customerSummaries: CustomerSummary[] = [];
  customerMap.forEach((summary) => {
    summary.totalOrders = summary.orders.length;
    summary.totalSpent = summary.orders.reduce((acc, currOrder) => {
        // Only add to totalSpent if the order status is 'completed'
        if (currOrder.status === 'completed') {
            return acc + currOrder.totalAmount;
        }
        return acc;
    }, 0);
    
    // Convert Date objects to Firebase Timestamps for Firestore
    const firestoreSummary: any = {
        ...summary,
        orders: undefined, // Don't store the orders array in the customer summary document
        firstOrderDate: summary.firstOrderDate ? Timestamp.fromDate(new Date(summary.firstOrderDate)) : null,
        lastOrderDate: summary.lastOrderDate ? Timestamp.fromDate(new Date(summary.lastOrderDate)) : null,
    };
    delete firestoreSummary.orders; // ensure orders array is not part of the document

    customerSummaries.push(firestoreSummary as CustomerSummary);
  });

  if (customerSummaries.length > 0) {
    console.log(`Seeding customers collection with ${customerSummaries.length} summaries...`);
    const batch = writeBatch(db);
    customerSummaries.forEach((customer) => {
      const docRef = doc(customersCollectionRef, customer.id); // Use phone as ID
      batch.set(docRef, customer);
    });
    try {
      await batch.commit();
      console.log("Successfully seeded customers collection.");
    } catch (error) {
      console.error("Error seeding customers collection:", error);
    }
  } else {
    console.log("No customer summaries to seed.");
  }
}


async function main() {
  await seedCollection<AdminUser>('adminUsers', placeholderAdminUsers, (user) => {
    // Ensure passwordHash is stored (even if it's plain text in this demo)
    return {
      username: user.username,
      passwordHash: user.passwordHash, // In a real app, this would be a securely generated hash.
      isSuperAdmin: user.isSuperAdmin,
      displayName: user.displayName || user.username,
    };
  });

  await seedCollection<Product>('products', placeholderProducts, (product) => {
    // Any transformations needed for product data before seeding
    return {
      ...product,
      price: Number(product.price) || 0, // Ensure price is a number
      isActive: product.isActive !== undefined ? product.isActive : true,
      category: product.category || '',
      dataAiHint: product.dataAiHint || '',
      imageUrl: product.imageUrl || '',
    };
  });
  
  await seedCollection<Order>('orders', placeholderOrders, (order) => {
    // Convert orderTimestamp to Firestore Timestamp
    return {
      ...order,
      orderTimestamp: Timestamp.fromDate(new Date(order.orderTimestamp)),
      totalAmount: Number(order.totalAmount) || 0,
      customerPhone: String(order.customerPhone || '').trim(),
      isViewedByAgent: order.isViewedByAgent !== undefined ? order.isViewedByAgent : false,
      agentNotes: order.agentNotes || '',
      customerNotes: order.customerNotes || '',
    };
  });

  await seedCustomersCollection();

  console.log('Firestore seeding process completed.');
}

main().catch((err) => {
  console.error('Unhandled error in main seeding function:', err);
});
    