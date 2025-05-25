
'use server';

import { db } from '@/lib/firebase/config';
import type { Order, OrderItem } from '@/lib/types';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';

// Helper function to convert Firestore doc data to Order
const orderFromDoc = (docSnap: any): Order => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    customerName: data.customerName || '',
    customerPhone: data.customerPhone || '',
    customerAddress: data.customerAddress || '',
    customerNotes: data.customerNotes || undefined, // Ensure it can be undefined
    items: data.items || [],
    totalAmount: data.totalAmount !== undefined ? Number(data.totalAmount) : 0,
    // Firestore Timestamps need to be converted to JS Date objects
    orderTimestamp: data.orderTimestamp instanceof Timestamp ? data.orderTimestamp.toDate() : new Date(0), // Default to epoch if invalid
    status: data.status || 'new',
    isViewedByAgent: data.isViewedByAgent !== undefined ? data.isViewedByAgent : false,
    agentNotes: data.agentNotes || undefined, // Ensure it can be undefined
  };
};


export async function getOrdersForAdmin(): Promise<Order[]> {
  console.log("Fetching orders from Firestore for admin.");
  try {
    const ordersCollection = collection(db, 'orders');
    const q = query(ordersCollection, orderBy('orderTimestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(docSnap => orderFromDoc(docSnap));
    console.log(`Fetched ${orders.length} orders from Firestore.`);
    return orders;
  } catch (error) {
    console.error("Error fetching orders from Firestore:", error);
    return [];
  }
}

export async function getOrderByIdForAdmin(orderId: string): Promise<Order | null> {
  console.log(`Fetching order with ID: ${orderId} from Firestore.`);
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(orderDocRef);
    if (docSnap.exists()) {
      return orderFromDoc(docSnap);
    } else {
      console.log("No such order document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching order by ID from Firestore:", error);
    return null;
  }
}

export async function createOrderService(orderDetails: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes?: string;
  items: OrderItem[];
  totalAmount: number;
}): Promise<Order> {
  console.log('Creating order in Firestore:', orderDetails);
  try {
    const newOrderData = {
      ...orderDetails,
      orderTimestamp: Timestamp.fromDate(new Date()), // Use Firestore Timestamp
      status: 'new' as Order['status'],
      isViewedByAgent: false,
      agentNotes: orderDetails.customerNotes || '', // Initialize with customer notes or empty
    };
    const docRef = await addDoc(collection(db, 'orders'), newOrderData);
    console.log("Order created with ID: ", docRef.id);
    // Return an Order object consistent with the application type
    return { 
        id: docRef.id,
        customerName: newOrderData.customerName,
        customerPhone: newOrderData.customerPhone,
        customerAddress: newOrderData.customerAddress,
        customerNotes: newOrderData.customerNotes,
        items: newOrderData.items,
        totalAmount: newOrderData.totalAmount,
        orderTimestamp: newOrderData.orderTimestamp.toDate(), // Convert to JS Date
        status: newOrderData.status,
        isViewedByAgent: newOrderData.isViewedByAgent,
        agentNotes: newOrderData.agentNotes,
    };
  } catch (error) {
    console.error("Error creating order in Firestore:", error);
    throw error; // Re-throw to be caught by UI
  }
}

export async function updateOrderStatusService(orderId: string, newStatus: Order['status']): Promise<Order | null> {
  console.log(`Updating order status for ID: ${orderId} to ${newStatus} in Firestore.`);
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const updateData: Partial<Order> = { status: newStatus };
    
    if (newStatus !== 'new') { // Any status other than 'new' implies it has been interacted with
      updateData.isViewedByAgent = true;
    }
     if (newStatus === 'received') { // Specifically mark as viewed if status becomes 'received'
      updateData.isViewedByAgent = true;
    }

    await updateDoc(orderDocRef, updateData);
    const updatedDocSnap = await getDoc(orderDocRef);
     if (updatedDocSnap.exists()) {
      return orderFromDoc(updatedDocSnap);
    }
    return null;
  } catch (error) {
    console.error("Error updating order status in Firestore:", error);
    return null;
  }
}

export async function markOrderAsViewedService(orderId: string): Promise<Order | null> {
  console.log(`Marking order as viewed for ID: ${orderId} in Firestore.`);
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(orderDocRef);

    if (!docSnap.exists()) {
      console.log("Order not found to mark as viewed.");
      return null;
    }

    const orderData = docSnap.data() as Order; // Cast to Order to access fields
    const updates: Partial<Order> = {};

    if (!orderData.isViewedByAgent) {
        updates.isViewedByAgent = true;
        if (orderData.status === 'new') {
            updates.status = 'received';
        }
    }
    
    if (Object.keys(updates).length > 0) {
        await updateDoc(orderDocRef, updates);
    }

    const updatedDocSnap = await getDoc(orderDocRef); // Fetch again to get the latest state
    if (updatedDocSnap.exists()) {
      return orderFromDoc(updatedDocSnap);
    }
    return null;

  } catch (error) {
    console.error("Error marking order as viewed in Firestore:", error);
    return null;
  }
}

export async function updateOrderAgentNotes(orderId: string, notes: string): Promise<Order | null> {
  console.log(`Updating agent notes for order ID: ${orderId} in Firestore.`);
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, { agentNotes: notes });
    const updatedDocSnap = await getDoc(orderDocRef);
    if (updatedDocSnap.exists()) {
      return orderFromDoc(updatedDocSnap);
    }
    return null;
  } catch (error) {
    console.error("Error updating agent notes in Firestore:", error);
    return null;
  }
}
