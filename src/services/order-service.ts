
'use server';

import { db } from '@/lib/firebase/config';
import type { Order, OrderItem, CustomerSummary } from '@/lib/types';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy, Timestamp, where, runTransaction } from 'firebase/firestore';

// Helper function to convert Firestore doc data to Order
const orderFromDoc = (docSnap: any): Order => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    customerName: data.customerName || '',
    customerPhone: data.customerPhone || '',
    customerAddress: data.customerAddress || '',
    customerNotes: data.customerNotes || '', 
    items: data.items || [],
    totalAmount: data.totalAmount !== undefined ? Number(data.totalAmount) : 0,
    orderTimestamp: data.orderTimestamp instanceof Timestamp ? data.orderTimestamp.toDate() : new Date(0),
    status: data.status || 'new',
    isViewedByAgent: data.isViewedByAgent !== undefined ? data.isViewedByAgent : false,
    agentNotes: data.agentNotes || '',
  };
};


export async function getOrdersForAdmin(): Promise<Order[]> {
  console.log("OrderService: Fetching orders from Firestore for admin.");
  try {
    const ordersCollectionRef = collection(db, 'orders');
    const q = query(ordersCollectionRef, orderBy('orderTimestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(docSnap => orderFromDoc(docSnap));
    console.log(`OrderService: Fetched ${orders.length} orders from Firestore.`);
    return orders;
  } catch (error) {
    console.error("OrderService: Error fetching orders from Firestore:", error);
    return [];
  }
}

export async function getOrderByIdForAdmin(orderId: string): Promise<Order | null> {
  console.log(`OrderService: Fetching order with ID: ${orderId} from Firestore.`);
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(orderDocRef);
    if (docSnap.exists()) {
      return orderFromDoc(docSnap);
    } else {
      console.warn(`OrderService: No order document found for ID: ${orderId}!`);
      return null;
    }
  } catch (error) {
    console.error(`OrderService: Error fetching order by ID ${orderId} from Firestore:`, error);
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
  console.log('OrderService: Creating order in Firestore:', orderDetails);
  try {
    // Reference to the orders collection
    const ordersCollectionRef = collection(db, 'orders');
    
    // Get all documents to find the highest current numeric ID
    const existingOrdersSnapshot = await getDocs(query(ordersCollectionRef, orderBy('orderTimestamp', 'desc')));
    let highestNumericId = 0;
    existingOrdersSnapshot.forEach(docSnap => {
      const docId = docSnap.id;
      if (docId.startsWith('o') && docId.length > 1) {
        const numericPartString = docId.substring(1);
        if (/^\d+$/.test(numericPartString)) { // Check if the part after 'o' is purely numeric
          const numericPart = parseInt(numericPartString, 10);
          if (numericPart > highestNumericId) {
            highestNumericId = numericPart;
          }
        }
      }
    });
    const newNumericId = highestNumericId + 1;
    const newOrderId = `o${newNumericId}`;

    // Prepare the new order data
    const newOrderData = {
      ...orderDetails,
      customerNotes: orderDetails.customerNotes || '', // Ensure notes is not undefined
      agentNotes: '', // Initialize agentNotes as empty
      orderTimestamp: Timestamp.fromDate(new Date()),
      status: 'new' as Order['status'],
      isViewedByAgent: false,
    };

    // Create a document reference with the new custom ID
    const orderDocRef = doc(db, 'orders', newOrderId);
    // Set the document data
    await setDoc(orderDocRef, newOrderData);
    
    console.log("OrderService: Order created with custom ID: ", newOrderId);
    
    // Retrieve the just-created document to return it in the expected format
    const createdDocSnap = await getDoc(orderDocRef);
    if (createdDocSnap.exists()) {
      return orderFromDoc(createdDocSnap);
    } else {
      throw new Error("OrderService: Failed to retrieve created order.");
    }
  } catch (error) {
    console.error("OrderService: Error creating order in Firestore:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function updateOrderStatusService(orderId: string, newStatus: Order['status']): Promise<Order | null> {
  console.log(`OrderService: Updating order status for ID: ${orderId} to ${newStatus} in Firestore.`);
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const updateData: Partial<Order> = { status: newStatus };
    
    // If status is changed to something other than 'new', mark as viewed
    if (newStatus === 'received' || newStatus === 'completed' || newStatus === 'cancelled') { 
      updateData.isViewedByAgent = true;
    }

    await updateDoc(orderDocRef, updateData as any); // Firestore update expects a plain object
    const updatedDocSnap = await getDoc(orderDocRef);
     if (updatedDocSnap.exists()) {
      return orderFromDoc(updatedDocSnap);
    }
    return null;
  } catch (error) {
    console.error(`OrderService: Error updating order status for ${orderId} in Firestore:`, error);
    return null;
  }
}

export async function markOrderAsViewedService(orderId: string): Promise<Order | null> {
  console.log(`OrderService: Marking order for ID: ${orderId} in Firestore. If status is 'new', it will be changed to 'received'.`);
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(orderDocRef);

    if (!docSnap.exists()) {
      console.warn(`OrderService: Order ${orderId} not found to mark as viewed/received.`);
      return null;
    }

    const orderData = docSnap.data() as Partial<Order>; // Assuming data matches Order structure partially
    const updates: Partial<Order> = {};

    if (orderData.status === 'new') {
        updates.status = 'received';
        updates.isViewedByAgent = true; // Explicitly set as viewed when status changes to received
    } else if (!orderData.isViewedByAgent) { // If not new, but simply wasn't viewed, mark as viewed
        updates.isViewedByAgent = true;
    }
    
    if (Object.keys(updates).length > 0) {
        await updateDoc(orderDocRef, updates as any); // Firestore update expects a plain object
    } else {
      console.log(`OrderService: No updates needed for order ${orderId} (already viewed or not 'new').`);
    }

    const updatedDocSnap = await getDoc(orderDocRef); // Get the latest state
    if (updatedDocSnap.exists()) {
      return orderFromDoc(updatedDocSnap);
    }
    return null;

  } catch (error) {
    console.error(`OrderService: Error marking order ${orderId} as viewed/received in Firestore:`, error);
    return null;
  }
}

export async function updateOrderAgentNotes(orderId: string, notes: string): Promise<Order | null> {
  console.log(`OrderService: Updating agent notes for order ID: ${orderId} in Firestore.`);
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, { agentNotes: notes });
    const updatedDocSnap = await getDoc(orderDocRef);
    if (updatedDocSnap.exists()) {
      return orderFromDoc(updatedDocSnap);
    }
    return null;
  } catch (err) {
    console.error(`OrderService: Error updating agent notes for ${orderId} in Firestore:`, err);
    return null;
  }
}

// Function to get unique customers based on orders
export async function getUniqueCustomersFromOrders(): Promise<CustomerSummary[]> {
  console.log("OrderService: Fetching unique customers from Firestore orders.");
  try {
    const orders = await getOrdersForAdmin(); // This fetches all orders, sorted by timestamp

    const customerMap = new Map<string, CustomerSummary>();

    for (const order of orders) {
      const phone = order.customerPhone;
      if (!phone) { // Skip orders with no customer phone, as it's the key
        console.warn(`OrderService: Skipping order ${order.id} due to missing customerPhone.`);
        continue;
      }

      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          id: phone, // Using phone number as ID for simplicity
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
      // Ensure lastOrderDate and related details are from the actual latest order
      if (order.orderTimestamp > summary.lastOrderDate) {
        summary.lastOrderDate = order.orderTimestamp;
        summary.latestAddress = order.customerAddress;
        summary.name = order.customerName; // Update name to the one from the latest order
      }
    }

    const customerSummaries = Array.from(customerMap.values());
    // Sort by customer name in Hebrew
    customerSummaries.sort((a, b) => a.name.localeCompare(b.name, 'he'));

    console.log(`OrderService: Processed ${customerSummaries.length} unique customers.`);
    return customerSummaries;
  } catch (error) {
    console.error("OrderService: Error fetching unique customers from orders:", error);
    return [];
  }
}


// Function to get all orders for a specific customer phone
export async function getOrdersByCustomerPhone(phone: string): Promise<Order[]> {
  console.log(`OrderService: Querying orders for phone (service): >>${phone}<<`); 
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    console.warn('OrderService: getOrdersByCustomerPhone called with invalid phone number.');
    return [];
  }
  try {
    const ordersCollectionRef = collection(db, 'orders');
    // Query for documents where 'customerPhone' field matches the provided phone number
    const q = query(
      ordersCollectionRef,
      where('customerPhone', '==', phone),
      orderBy('orderTimestamp', 'desc') // Order by date, newest first
    );
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(docSnap => orderFromDoc(docSnap));
    console.log(`OrderService: Fetched ${orders.length} orders for customer phone: >>${phone}<<.`);
    return orders;
  } catch (error) {
    console.error(`OrderService: Error fetching orders for customer ${phone}:`, error);
    return [];
  }
}

    
