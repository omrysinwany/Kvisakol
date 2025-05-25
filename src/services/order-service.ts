
'use server';

import { db } from '@/lib/firebase/config';
import type { Order, OrderItem, CustomerSummary } from '@/lib/types';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy, Timestamp, where } from 'firebase/firestore';

// Helper function to convert Firestore doc data to Order
const orderFromDoc = (docSnap: any): Order => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    customerName: data.customerName || '',
    customerPhone: data.customerPhone || '',
    customerAddress: data.customerAddress || '',
    customerNotes: data.customerNotes || '', // Ensure it's an empty string if undefined
    items: data.items || [],
    totalAmount: data.totalAmount !== undefined ? Number(data.totalAmount) : 0,
    orderTimestamp: data.orderTimestamp instanceof Timestamp ? data.orderTimestamp.toDate() : new Date(0),
    status: data.status || 'new',
    isViewedByAgent: data.isViewedByAgent !== undefined ? data.isViewedByAgent : false,
    agentNotes: data.agentNotes || '',
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
    // To generate o1, o2 style IDs:
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
      customerNotes: orderDetails.customerNotes || '', // Ensure customerNotes is an empty string if undefined
      agentNotes: '', // Initialize agentNotes as an empty string
      orderTimestamp: Timestamp.fromDate(new Date()),
      status: 'new' as Order['status'],
      isViewedByAgent: false,
    };

    const orderDocRef = doc(db, 'orders', newOrderId);
    await setDoc(orderDocRef, newOrderData);
    
    console.log("Order created with custom ID: ", newOrderId);
    
    const createdDocSnap = await getDoc(orderDocRef);
    if (createdDocSnap.exists()) {
      return orderFromDoc(createdDocSnap);
    } else {
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
    
    if (newStatus === 'received' || newStatus === 'completed' || newStatus === 'cancelled') { 
      updateData.isViewedByAgent = true;
    }

    await updateDoc(orderDocRef, updateData as any); // Type assertion needed for partial update
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
  console.log(`Marking order for ID: ${orderId} in Firestore. If new, will change status to 'received'.`);
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(orderDocRef);

    if (!docSnap.exists()) {
      console.log("Order not found to mark as viewed/received.");
      return null;
    }

    const orderData = docSnap.data() as Partial<Order>; 
    const updates: Partial<Order> = {};

    if (!orderData.isViewedByAgent) {
        updates.isViewedByAgent = true;
    }
    // Always change status to 'received' if it was 'new' and is being viewed for the first time.
    if (orderData.status === 'new') {
        updates.status = 'received';
        if (!updates.isViewedByAgent) { // Ensure isViewedByAgent is also set if status changes due to viewing
            updates.isViewedByAgent = true;
        }
    }
    
    if (Object.keys(updates).length > 0) {
        await updateDoc(orderDocRef, updates as any); // Type assertion
    }

    const updatedDocSnap = await getDoc(orderDocRef); 
    if (updatedDocSnap.exists()) {
      return orderFromDoc(updatedDocSnap);
    }
    return null;

  } catch (error) {
    console.error("Error marking order as viewed/received in Firestore:", error);
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
  } catch (err) {
    console.error("Error updating agent notes in Firestore:", err);
    return null;
  }
}

export async function getUniqueCustomersFromOrders(): Promise<CustomerSummary[]> {
  console.log("Fetching unique customers from Firestore orders.");
  try {
    const orders = await getOrdersForAdmin(); 

    const customerMap = new Map<string, CustomerSummary>();

    for (const order of orders) {
      const phone = order.customerPhone;
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          id: phone, 
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
      if (order.orderTimestamp > summary.lastOrderDate) {
        summary.lastOrderDate = order.orderTimestamp;
        summary.latestAddress = order.customerAddress;
        summary.name = order.customerName; 
      }
    }

    const customerSummaries = Array.from(customerMap.values());
    customerSummaries.sort((a, b) => a.name.localeCompare(b.name, 'he'));

    console.log(`Processed ${customerSummaries.length} unique customers.`);
    return customerSummaries;
  } catch (error) {
    console.error("Error fetching unique customers from orders:", error);
    return [];
  }
}


export async function getOrdersByCustomerPhone(phone: string): Promise<Order[]> {
  console.log(`Fetching orders for customer phone: ${phone} from Firestore.`);
  try {
    const ordersCollectionRef = collection(db, 'orders');
    const q = query(
      ordersCollectionRef,
      where('customerPhone', '==', phone),
      orderBy('orderTimestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(docSnap => orderFromDoc(docSnap));
    console.log(`Fetched ${orders.length} orders for customer ${phone}.`);
    return orders;
  } catch (error) {
    console.error(`Error fetching orders for customer ${phone}:`, error);
    return [];
  }
}

// This function is no longer needed as its logic is now in AdminCustomerDetailPage
// export async function getCustomerSummaryByPhone(phone: string): Promise<CustomerSummary | null> { ... }

    