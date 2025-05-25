
'use server';

import { db } from '@/lib/firebase/config';
import type { Order, OrderItem } from '@/lib/types';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';

// Helper function to convert Firestore doc data to Order
const orderFromDoc = (docSnap: any): Order => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    customerName: data.customerName || '',
    customerPhone: data.customerPhone || '',
    customerAddress: data.customerAddress || '',
    customerNotes: data.customerNotes || undefined,
    items: data.items || [],
    totalAmount: data.totalAmount !== undefined ? Number(data.totalAmount) : 0,
    orderTimestamp: data.orderTimestamp instanceof Timestamp ? data.orderTimestamp.toDate() : new Date(0),
    status: data.status || 'new',
    isViewedByAgent: data.isViewedByAgent !== undefined ? data.isViewedByAgent : false,
    agentNotes: data.agentNotes || undefined,
  };
};


export async function getOrdersForAdmin(): Promise<Order[]> {
  console.log("Fetching orders from Firestore for admin.");
  try {
    const ordersCollectionRef = collection(db, 'orders');
    const q = query(ordersCollectionRef, orderBy('orderTimestamp', 'desc'));
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
    // Determine the next sequential ID in 'oX' format
    const ordersCollectionRef = collection(db, 'orders');
    const existingOrdersSnapshot = await getDocs(ordersCollectionRef);
    let highestNumericId = 0;
    existingOrdersSnapshot.forEach(docSnap => {
      const docId = docSnap.id;
      if (docId.startsWith('o')) {
        const numericPart = parseInt(docId.substring(1), 10);
        if (!isNaN(numericPart) && numericPart > highestNumericId) {
          highestNumericId = numericPart;
        }
      }
    });
    const newNumericId = highestNumericId + 1;
    const newOrderId = `o${newNumericId}`;

    const newOrderData = {
      ...orderDetails,
      orderTimestamp: Timestamp.fromDate(new Date()), // Use Firestore Timestamp
      status: 'new' as Order['status'],
      isViewedByAgent: false,
      agentNotes: orderDetails.customerNotes || '', 
    };

    const orderDocRef = doc(db, 'orders', newOrderId);
    await setDoc(orderDocRef, newOrderData);
    
    console.log("Order created with custom ID: ", newOrderId);
    
    return { 
        id: newOrderId, // Use the new custom ID
        customerName: newOrderData.customerName,
        customerPhone: newOrderData.customerPhone,
        customerAddress: newOrderData.customerAddress,
        customerNotes: newOrderData.customerNotes,
        items: newOrderData.items,
        totalAmount: newOrderData.totalAmount,
        orderTimestamp: newOrderData.orderTimestamp.toDate(),
        status: newOrderData.status,
        isViewedByAgent: newOrderData.isViewedByAgent,
        agentNotes: newOrderData.agentNotes,
    };
  } catch (error) {
    console.error("Error creating order in Firestore:", error);
    throw error;
  }
}

export async function updateOrderStatusService(orderId: string, newStatus: Order['status']): Promise<Order | null> {
  console.log(`Updating order status for ID: ${orderId} to ${newStatus} in Firestore.`);
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const updateData: Partial<Order> = { status: newStatus };
    
    if (newStatus !== 'new') { 
      updateData.isViewedByAgent = true;
    }
     if (newStatus === 'received') { 
      updateData.isViewedByAgent = true;
    }

    await updateDoc(orderDocRef, updateData as any); // Use 'as any' to bypass strict type check for Partial
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

    const orderData = docSnap.data();
    const updates: Partial<Order> = {};

    if (!orderData.isViewedByAgent) {
        updates.isViewedByAgent = true;
        if (orderData.status === 'new') {
            updates.status = 'received';
        }
    }
    
    if (Object.keys(updates).length > 0) {
        await updateDoc(orderDocRef, updates as any); // Use 'as any' for partial update
    }

    const updatedDocSnap = await getDoc(orderDocRef); 
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
