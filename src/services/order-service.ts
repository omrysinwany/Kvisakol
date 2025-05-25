
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
    // console.log(`OrderService: customerSummaryFromDoc: data for ${docSnap.id}:`, data); // Kept for debugging if needed
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
      console.log(`OrderService: Order found for ID ${orderId}:`, docSnap.data());
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
  console.log('OrderService: Creating order in Firestore for customer phone:', orderDetails.customerPhone, 'with details:', orderDetails);
  const currentTimestamp = Timestamp.fromDate(new Date());
  const ordersCollectionRef = collection(db, 'orders');

  // Determine next order ID (e.g., o1, o2, ...)
  let newOrderId = 'o1';
  try {
    const ordersSnapshot = await getDocs(query(ordersCollectionRef, orderBy('orderTimestamp', 'desc'))); // Order by timestamp for somewhat chronological IDs if numbers overlap
    let maxOrderNumber = 0;
    ordersSnapshot.docs.forEach(doc => {
      const id = doc.id;
      if (id.startsWith('o')) {
        const numPart = parseInt(id.substring(1), 10);
        if (!isNaN(numPart) && numPart > maxOrderNumber) {
          maxOrderNumber = numPart;
        }
      }
    });
    newOrderId = `o${maxOrderNumber + 1}`;
  } catch (e) {
    console.error("OrderService: Error determining next order ID for 'oX' format, defaulting to potential collision or Firestore auto-ID logic if this fails:", e);
    // Fallback or decide if strict 'oX' format is critical; for now, proceeding with calculated newOrderId
  }
  console.log(`OrderService: Determined new order ID: ${newOrderId}`);

  const newOrderDocRef = doc(ordersCollectionRef, newOrderId); 
  let agentNoteForNameDiscrepancy = "";

  const newOrderData = {
    customerName: orderDetails.customerName,
    customerPhone: orderDetails.customerPhone,
    customerAddress: orderDetails.customerAddress,
    customerNotes: orderDetails.customerNotes || '',
    items: orderDetails.items,
    totalAmount: orderDetails.totalAmount,
    orderTimestamp: currentTimestamp,
    status: 'new' as Order['status'],
    isViewedByAgent: false,
    agentNotes: '', 
  };
  console.log(`OrderService: Preparing to save new order ${newOrderId}. Customer details: Name='${orderDetails.customerName}', Phone='${orderDetails.customerPhone}'`);

  try {
    const customerDocRef = doc(db, 'customers', orderDetails.customerPhone); // Use phone as customer ID
    console.log(`OrderService: Attempting transaction for customer document: ${orderDetails.customerPhone}`);
    
    await runTransaction(db, async (transaction) => {
      const customerDocSnap = await transaction.get(customerDocRef);
      if (!customerDocSnap.exists()) {
        const newCustomerData = {
          name: orderDetails.customerName,
          phone: orderDetails.customerPhone, 
          firstOrderDate: currentTimestamp,
          lastOrderDate: currentTimestamp,
          totalOrders: 1,
          totalSpent: orderDetails.totalAmount,
          latestAddress: orderDetails.customerAddress,
        };
        transaction.set(customerDocRef, newCustomerData);
        console.log(`OrderService: Created NEW customer document for ${orderDetails.customerPhone} with data:`, newCustomerData);
      } else {
        const existingCustomerData = customerDocSnap.data();
        const existingCustomerName = existingCustomerData.name;
        
        if (orderDetails.customerName !== existingCustomerName) {
            agentNoteForNameDiscrepancy = `הערת מערכת: שם בהזמנה זו ('${orderDetails.customerName}') שונה מהשם הרשום ללקוח זה ('${existingCustomerName}').`;
            console.log(`OrderService: Customer name mismatch for phone ${orderDetails.customerPhone}. Order name: '${orderDetails.customerName}', Stored name: '${existingCustomerName}'. Agent note will be added.`);
        }

        const updatedCustomerData: any = { // Use 'any' or a more specific type for update data
          lastOrderDate: currentTimestamp,
          totalOrders: increment(1),
          totalSpent: increment(orderDetails.totalAmount),
          latestAddress: orderDetails.customerAddress,
          // name: existingCustomerName, // Keep original name in customers collection
        };
        // Ensure firstOrderDate is preserved and not overwritten if it exists
        if (existingCustomerData.firstOrderDate) {
            updatedCustomerData.firstOrderDate = existingCustomerData.firstOrderDate;
        } else {
            updatedCustomerData.firstOrderDate = currentTimestamp;
        }
        
        transaction.update(customerDocRef, updatedCustomerData);
        console.log(`OrderService: UPDATED existing customer document for ${orderDetails.customerPhone}. Update data:`, updatedCustomerData);
      }
    });
    
    if (agentNoteForNameDiscrepancy) {
        newOrderData.agentNotes = (newOrderData.agentNotes ? newOrderData.agentNotes + "\n\n" : "") + agentNoteForNameDiscrepancy;
    }
    
    await setDoc(newOrderDocRef, newOrderData);
    console.log("OrderService: Order created with ID: ", newOrderId, "and data:", newOrderData);

    const createdOrderSnap = await getDoc(newOrderDocRef);
    if (createdOrderSnap.exists()) {
      return orderFromDoc(createdOrderSnap);
    } else {
      console.error("OrderService: Failed to retrieve created order after setting.");
      throw new Error("OrderService: Failed to retrieve created order after setting.");
    }
  } catch (error) {
    console.error("OrderService: Error creating order in Firestore:", error);
    throw error; 
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
        console.log(`OrderService: Order ${orderId} status changing from 'new' to 'received' and marked as viewed.`);
    } else if (!orderData.isViewedByAgent) { 
        updates.isViewedByAgent = true;
        console.log(`OrderService: Order ${orderId} marked as viewed (status was not 'new').`);
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

export async function getUniqueCustomers(): Promise<CustomerSummary[]> {
  console.log("OrderService: Fetching unique customers from 'customers' collection in Firestore.");
  try {
    const customersCollectionRef = collection(db, 'customers');
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


export async function getOrdersByCustomerPhone(phone: string): Promise<Order[]> {
  console.log(`OrderService: getOrdersByCustomerPhone: Received phone to query for orders: >>${phone}<< (Type: ${typeof phone})`);
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    console.warn('OrderService: getOrdersByCustomerPhone called with invalid or empty phone number. Returning empty array.');
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
    console.log(`OrderService: getOrdersByCustomerPhone: Firestore query for 'customerPhone == "${phone}"' found ${orders.length} orders. Order IDs: [${orders.map(o=> o.id).join(', ')}]`);
    return orders;
  } catch (error) {
    console.error(`OrderService: Error fetching orders for customer phone ${phone}:`, error);
    return [];
  }
}

export async function getCustomerSummaryById(customerId: string): Promise<CustomerSummary | null> {
    console.log(`OrderService: Fetching customer summary for ID (phone): ${customerId} from 'customers' collection.`);
    if (!customerId) {
      console.warn("OrderService: getCustomerSummaryById called with no customerId. Returning null.");
      return null;
    }
    try {
      const customerDocRef = doc(db, 'customers', customerId);
      const docSnap = await getDoc(customerDocRef);
      if (docSnap.exists()) {
        const customerData = customerSummaryFromDoc(docSnap);
        console.log(`OrderService: Customer summary found for ID ${customerId} in 'customers' collection:`, customerData);
        return customerData;
      } else {
        console.warn(`OrderService: No customer document found in 'customers' collection for ID: ${customerId}.`);
        return null;
      }
    } catch (error) {
      console.error(`OrderService: Error fetching customer summary by ID ${customerId} from 'customers' collection:`, error);
      return null;
    }
  }
