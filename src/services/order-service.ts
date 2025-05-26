
'use server';

import { db } from '@/lib/firebase/config';
import type { Order, OrderItem, CustomerSummary } from '@/lib/types';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy, Timestamp, where, runTransaction, increment, limit as firestoreLimit } from 'firebase/firestore';

// Helper function to convert Firestore doc data to Order
const orderFromDoc = (docSnap: any): Order => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    customerName: data.customerName || '',
    customerPhone: String(data.customerPhone || '').trim(),
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
      id: docSnap.id, 
      name: data.name || '',
      phone: String(data.phone || '').trim(), 
      firstOrderDate: data.firstOrderDate instanceof Timestamp ? data.firstOrderDate.toDate() : undefined,
      lastOrderDate: data.lastOrderDate instanceof Timestamp ? data.lastOrderDate.toDate() : new Date(0),
      totalOrders: data.totalOrders || 0,
      totalSpent: data.totalSpent || 0,
      latestAddress: data.latestAddress || '',
      generalAgentNotes: data.generalAgentNotes || '',
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

async function getNextOrderId(): Promise<string> {
  const ordersCollectionRef = collection(db, 'orders');
  const q = query(ordersCollectionRef, orderBy('id', 'desc'), firestoreLimit(1000)); // Limit to reasonable number for performance
  const querySnapshot = await getDocs(q);
  
  let maxNumericId = 0;
  querySnapshot.docs.forEach(docSnap => {
    const docId = docSnap.id;
    if (docId.startsWith('o')) {
      const numericPart = parseInt(docId.substring(1), 10);
      if (!isNaN(numericPart) && numericPart > maxNumericId) {
        maxNumericId = numericPart;
      }
    }
  });
  return `o${maxNumericId + 1}`;
}

export async function createOrderService(orderDetails: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes?: string;
  items: OrderItem[];
  totalAmount: number;
}): Promise<Order> {
  console.log('OrderService: createOrderService called for customer phone:', orderDetails.customerPhone, 'with details:', orderDetails);
  const currentTimestamp = Timestamp.fromDate(new Date());
  
  const customerPhoneTrimmed = String(orderDetails.customerPhone || '').trim();
  const newOrderId = await getNextOrderId(); 
  console.log(`OrderService: Generated new order ID: ${newOrderId}`);
  
  let agentNoteForNameDiscrepancy = "";

  const newOrderData: Omit<Order, 'id'> = {
    customerName: orderDetails.customerName,
    customerPhone: customerPhoneTrimmed, 
    customerAddress: orderDetails.customerAddress,
    customerNotes: orderDetails.customerNotes || '',
    items: orderDetails.items,
    totalAmount: orderDetails.totalAmount,
    orderTimestamp: currentTimestamp.toDate(),
    status: 'new' as Order['status'],
    isViewedByAgent: false,
    agentNotes: '',
  };
  console.log(`OrderService: Preparing to save new order ${newOrderId}. Customer details: Name='${orderDetails.customerName}', Phone='${customerPhoneTrimmed}'`);

  try {
    const customerDocRef = doc(db, 'customers', customerPhoneTrimmed); 
    console.log(`OrderService: Attempting transaction for customer document: ${customerPhoneTrimmed}`);
    
    await runTransaction(db, async (transaction) => {
      const customerDocSnap = await transaction.get(customerDocRef);
      if (!customerDocSnap.exists()) {
        const newCustomerData = {
          name: orderDetails.customerName,
          phone: customerPhoneTrimmed, 
          firstOrderDate: currentTimestamp,
          lastOrderDate: currentTimestamp,
          totalOrders: 1,
          totalSpent: orderDetails.totalAmount,
          latestAddress: orderDetails.customerAddress,
          generalAgentNotes: '',
        };
        transaction.set(customerDocRef, newCustomerData);
        console.log(`OrderService: Created NEW customer document for ${customerPhoneTrimmed} with data:`, newCustomerData);
      } else {
        const existingCustomerData = customerDocSnap.data();
        const existingCustomerName = existingCustomerData.name;
        
        if (orderDetails.customerName !== existingCustomerName) {
            agentNoteForNameDiscrepancy = `הערת מערכת: שם בהזמנה זו ('${orderDetails.customerName}') שונה מהשם הרשום ללקוח זה ('${existingCustomerName}').`;
            console.log(`OrderService: Customer name mismatch for phone ${customerPhoneTrimmed}. Order name: '${orderDetails.customerName}', Stored name: '${existingCustomerName}'. Agent note will be added.`);
        }

        const updatedCustomerData: any = { 
          lastOrderDate: currentTimestamp,
          totalOrders: increment(1),
          totalSpent: increment(orderDetails.totalAmount),
          latestAddress: orderDetails.customerAddress,
          // name is NOT updated here to keep original name from first order or manual admin update
        };
        if (!existingCustomerData.firstOrderDate) { 
            updatedCustomerData.firstOrderDate = currentTimestamp;
        }
        
        transaction.update(customerDocRef, updatedCustomerData);
        console.log(`OrderService: UPDATED existing customer document for ${customerPhoneTrimmed}. Update data:`, updatedCustomerData);
      }
    });
    
    if (agentNoteForNameDiscrepancy) {
        newOrderData.agentNotes = (newOrderData.agentNotes ? newOrderData.agentNotes + "\n\n" : "") + agentNoteForNameDiscrepancy;
    }
    
    const newOrderDocRefWithId = doc(db, 'orders', newOrderId);
    await setDoc(newOrderDocRefWithId, newOrderData);
    console.log("OrderService: Order created with ID: ", newOrderId, "and data:", newOrderData);
    console.log(`OrderService: New order saved to Firestore. Customer phone in order: ${newOrderData.customerPhone}`);

    const createdOrder: Order = {
        id: newOrderId,
        ...newOrderData,
    };
    return createdOrder;

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
  const cleanedPhoneInput = String(phone || '').trim();
  console.log(`OrderService (getOrdersByCustomerPhone): Received phone to query: >>${phone}<<, Cleaned phone for query: >>${cleanedPhoneInput}<< (Type: ${typeof cleanedPhoneInput})`);
  
  if (!cleanedPhoneInput) {
    console.warn('OrderService (getOrdersByCustomerPhone): called with invalid or empty phone number after cleaning. Returning empty array.');
    return [];
  }
  try {
    const ordersCollectionRef = collection(db, 'orders');
    const q = query(
      ordersCollectionRef,
      where('customerPhone', '==', cleanedPhoneInput),
      orderBy('orderTimestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log(`OrderService (getOrdersByCustomerPhone): No orders found for phone ${cleanedPhoneInput}.`);
      return [];
    }
    const orders = querySnapshot.docs.map(docSnap => {
      const orderData = orderFromDoc(docSnap);
      console.log(`OrderService (getOrdersByCustomerPhone): Order doc data for phone ${cleanedPhoneInput}: ID=${orderData.id}, CustomerPhoneInOrder=${orderData.customerPhone}`);
      return orderData;
    });
    console.log(`OrderService (getOrdersByCustomerPhone): Found ${orders.length} orders for phone ${cleanedPhoneInput}. First 3 orders:`, orders.slice(0,3).map(o => ({id: o.id, customerName: o.customerName, customerPhoneInOrder: o.customerPhone })));
    return orders;
  } catch (error) {
    console.error(`OrderService (getOrdersByCustomerPhone): Error fetching orders for customer phone ${cleanedPhoneInput}:`, error);
    return [];
  }
}

export async function getCustomerSummaryById(customerId: string): Promise<CustomerSummary | null> {
    const cleanedCustomerId = String(customerId || '').trim();
    console.log(`OrderService (getCustomerSummaryById): Fetching customer summary for ID (phone): >>${cleanedCustomerId}<< from 'customers' collection.`);
    if (!cleanedCustomerId) {
      console.warn("OrderService (getCustomerSummaryById): called with no customerId after cleaning. Returning null.");
      return null;
    }
    try {
      const customerDocRef = doc(db, 'customers', cleanedCustomerId);
      const docSnap = await getDoc(customerDocRef);
      if (docSnap.exists()) {
        const customerData = customerSummaryFromDoc(docSnap);
        console.log(`OrderService (getCustomerSummaryById): Customer summary found for ID ${cleanedCustomerId} in 'customers' collection:`, JSON.stringify(customerData, null, 2));
        return customerData;
      } else {
        console.warn(`OrderService (getCustomerSummaryById): No customer document found in 'customers' collection for ID: ${cleanedCustomerId}.`);
        return null;
      }
    } catch (error) {
      console.error(`OrderService (getCustomerSummaryById): Error fetching customer summary by ID ${cleanedCustomerId} from 'customers' collection:`, error);
      return null;
    }
  }

export async function updateCustomerGeneralNotes(customerId: string, notes: string): Promise<CustomerSummary | null> {
  const cleanedCustomerId = String(customerId || '').trim();
  console.log(`OrderService: Updating general agent notes for customer ID: ${cleanedCustomerId} in Firestore.`);
  if (!cleanedCustomerId) {
    console.warn("OrderService (updateCustomerGeneralNotes): called with no customerId. Cannot update notes.");
    return null;
  }
  try {
    const customerDocRef = doc(db, 'customers', cleanedCustomerId);
    await updateDoc(customerDocRef, { generalAgentNotes: notes });
    const updatedDocSnap = await getDoc(customerDocRef);
    if (updatedDocSnap.exists()) {
      console.log(`OrderService: Successfully updated general agent notes for customer ${cleanedCustomerId}.`);
      return customerSummaryFromDoc(updatedDocSnap);
    }
    return null;
  } catch (err) {
    console.error(`OrderService: Error updating general agent notes for ${cleanedCustomerId} in Firestore:`, err);
    return null;
  }
}

