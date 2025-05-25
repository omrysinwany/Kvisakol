
'use server';

import { db } from '@/lib/firebase/config';
import type { Order, OrderItem, CustomerSummary } from '@/lib/types';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';

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
    const ordersCollectionRef = collection(db, 'orders');
    const existingOrdersSnapshot = await getDocs(query(ordersCollectionRef, orderBy('orderTimestamp', 'desc')));
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
      orderTimestamp: Timestamp.fromDate(new Date()),
      status: 'new' as Order['status'],
      isViewedByAgent: false,
      agentNotes: '',
    };

    const orderDocRef = doc(db, 'orders', newOrderId);
    await setDoc(orderDocRef, newOrderData);
    
    console.log("Order created with custom ID: ", newOrderId);
    
    // Fetch the just created document to return it with the ID and converted timestamp
    const createdDocSnap = await getDoc(orderDocRef);
    if (createdDocSnap.exists()) {
      return orderFromDoc(createdDocSnap);
    } else {
      // Fallback, should not happen if setDoc was successful
      throw new Error("Failed to retrieve created order.");
    }
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

    await updateDoc(orderDocRef, updateData as any);
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
        await updateDoc(orderDocRef, updates as any);
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

export async function getUniqueCustomersFromOrders(): Promise<CustomerSummary[]> {
  console.log("Fetching unique customers from Firestore orders.");
  try {
    const orders = await getOrdersForAdmin(); // This already sorts orders by orderTimestamp desc

    const customerMap = new Map<string, CustomerSummary>();

    for (const order of orders) {
      const phone = order.customerPhone;
      if (!customerMap.has(phone)) {
        // This is the first time we see this customer (due to sorting, it's their latest order info)
        customerMap.set(phone, {
          id: phone, // Using phone as a unique ID for the summary
          phone: phone,
          name: order.customerName,
          lastOrderDate: order.orderTimestamp,
          totalOrders: 0,
          totalSpent: 0,
          latestAddress: order.customerAddress,
        });
      }

      const summary = customerMap.get(phone)!;
      summary.totalOrders += 1;
      summary.totalSpent += order.totalAmount;
      // name, latestAddress, and lastOrderDate are already set from the most recent order
      // because getOrdersForAdmin sorts by orderTimestamp descending.
    }

    const customerSummaries = Array.from(customerMap.values());
    // Sort by customer name for display
    customerSummaries.sort((a, b) => a.name.localeCompare(b.name, 'he'));

    console.log(`Processed ${customerSummaries.length} unique customers.`);
    return customerSummaries;
  } catch (error) {
    console.error("Error fetching unique customers from orders:", error);
    return [];
  }
}
