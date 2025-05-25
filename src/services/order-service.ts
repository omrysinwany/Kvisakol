
'use server';

import { db } from '@/lib/firebase/config';
import type { Order, OrderItem, CustomerSummary } from '@/lib/types';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy, Timestamp, where, runTransaction, increment, serverTimestamp } from 'firebase/firestore';

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

// Helper function to convert Firestore doc data to CustomerSummary
const customerSummaryFromDoc = (docSnap: any): CustomerSummary => {
    const data = docSnap.data();
    return {
      id: docSnap.id, // This is the customer's phone number
      name: data.name || '',
      phone: data.phone || '', // Should be same as id
      firstOrderDate: data.firstOrderDate instanceof Timestamp ? data.firstOrderDate.toDate() : undefined,
      lastOrderDate: data.lastOrderDate instanceof Timestamp ? data.lastOrderDate.toDate() : new Date(0),
      totalOrders: data.totalOrders || 0,
      totalSpent: data.totalSpent || 0,
      latestAddress: data.latestAddress || '',
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
  const currentTimestamp = Timestamp.fromDate(new Date());

  // Generate new order ID (o1, o2, etc.)
  const ordersCollectionRef = collection(db, 'orders');
  // To generate a simple incrementing ID like o1, o2, we'd need to count existing 'oX' documents or use a counter.
  // For simplicity with Firestore, relying on auto-generated IDs or a more robust custom ID generation is better.
  // Let's stick to Firestore's auto-generated IDs for now to ensure uniqueness without complex queries.
  // If a specific "oX" format is strictly needed, this part would need significant changes.
  // For now, we'll use Firestore's auto ID generation by not specifying an ID in doc().

  const newOrderDocRef = doc(ordersCollectionRef); // Firestore generates the ID
  const newOrderId = newOrderDocRef.id; // Get the auto-generated ID

  const newOrderData = {
    ...orderDetails,
    customerNotes: orderDetails.customerNotes || '',
    agentNotes: '',
    orderTimestamp: currentTimestamp,
    status: 'new' as Order['status'],
    isViewedByAgent: false,
  };

  try {
    await setDoc(newOrderDocRef, newOrderData);
    console.log("OrderService: Order created with auto-generated ID: ", newOrderId);

    // Create or update customer document
    const customerDocRef = doc(db, 'customers', orderDetails.customerPhone);
    
    await runTransaction(db, async (transaction) => {
      const customerDocSnap = await transaction.get(customerDocRef);
      if (!customerDocSnap.exists()) {
        // New customer
        transaction.set(customerDocRef, {
          name: orderDetails.customerName,
          phone: orderDetails.customerPhone,
          firstOrderDate: currentTimestamp,
          lastOrderDate: currentTimestamp,
          totalOrders: 1,
          totalSpent: orderDetails.totalAmount,
          latestAddress: orderDetails.customerAddress,
        });
        console.log(`OrderService: Created new customer document for ${orderDetails.customerPhone}`);
      } else {
        // Existing customer
        const customerData = customerDocSnap.data();
        transaction.update(customerDocRef, {
          name: orderDetails.customerName, // Update name in case it changed
          lastOrderDate: currentTimestamp,
          totalOrders: increment(1),
          totalSpent: increment(orderDetails.totalAmount),
          latestAddress: orderDetails.customerAddress,
          // Ensure firstOrderDate is not overwritten if it exists
          firstOrderDate: customerData.firstOrderDate || currentTimestamp,
        });
        console.log(`OrderService: Updated customer document for ${orderDetails.customerPhone}`);
      }
    });

    // Fetch the created order to return it
    const createdOrderSnap = await getDoc(newOrderDocRef);
    if (createdOrderSnap.exists()) {
      return orderFromDoc(createdOrderSnap);
    } else {
      throw new Error("OrderService: Failed to retrieve created order after setting.");
    }
  } catch (error) {
    console.error("OrderService: Error creating order in Firestore:", error);
    throw error; // Re-throw to be caught by the calling form
  }
}


export async function updateOrderStatusService(orderId: string, newStatus: Order['status']): Promise<Order | null> {
  console.log(`OrderService: Updating order status for ID: ${orderId} to ${newStatus} in Firestore.`);
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const updateData: Partial<Order> = { status: newStatus };

    if (newStatus === 'received' || newStatus === 'completed' || newStatus === 'cancelled') {
      updateData.isViewedByAgent = true;
    }

    await updateDoc(orderDocRef, updateData as any);
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

    const orderData = docSnap.data();
    const updates: Partial<Order> = {};

    if (orderData.status === 'new') {
        updates.status = 'received';
        updates.isViewedByAgent = true;
    } else if (!orderData.isViewedByAgent) { // If not 'new' but still not viewed, mark as viewed
        updates.isViewedByAgent = true;
    }


    if (Object.keys(updates).length > 0) {
        await updateDoc(orderDocRef, updates as any);
        console.log(`OrderService: Order ${orderId} successfully updated:`, updates);
    } else {
      console.log(`OrderService: No updates needed for order ${orderId} (already viewed or not 'new').`);
    }

    const updatedDocSnap = await getDoc(orderDocRef);
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

// Function to get unique customers from the 'customers' collection
export async function getUniqueCustomers(): Promise<CustomerSummary[]> {
  console.log("OrderService: Fetching unique customers from 'customers' collection in Firestore.");
  try {
    const customersCollectionRef = collection(db, 'customers');
    // Order by name for consistent display, can be changed if needed
    const q = query(customersCollectionRef, orderBy('name', 'asc')); 
    const querySnapshot = await getDocs(q);
    const customers = querySnapshot.docs.map(docSnap => customerSummaryFromDoc(docSnap));
    console.log(`OrderService: Fetched ${customers.length} unique customers from 'customers' collection.`);
    return customers;
  } catch (error) {
    console.error("OrderService: Error fetching unique customers from 'customers' collection:", error);
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
    const q = query(
      ordersCollectionRef,
      where('customerPhone', '==', phone),
      orderBy('orderTimestamp', 'desc')
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

// Function to get a single customer summary by phone (ID) from 'customers' collection
export async function getCustomerSummaryById(customerId: string): Promise<CustomerSummary | null> {
    console.log(`OrderService: Fetching customer summary for ID (phone): ${customerId} from 'customers' collection.`);
    if (!customerId) {
      console.warn("OrderService: getCustomerSummaryById called with no customerId.");
      return null;
    }
    try {
      const customerDocRef = doc(db, 'customers', customerId);
      const docSnap = await getDoc(customerDocRef);
      if (docSnap.exists()) {
        console.log(`OrderService: Customer summary found for ID ${customerId}:`, docSnap.data());
        return customerSummaryFromDoc(docSnap);
      } else {
        console.warn(`OrderService: No customer document found in 'customers' collection for ID: ${customerId}.`);
        return null;
      }
    } catch (error) {
      console.error(`OrderService: Error fetching customer summary by ID ${customerId} from 'customers' collection:`, error);
      return null;
    }
  }
