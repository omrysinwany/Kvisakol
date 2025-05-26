
'use server';

import { db } from '@/lib/firebase/config';
import type { Order, OrderItem, CustomerSummary } from '@/lib/types';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy, Timestamp, where, runTransaction, increment, limit as firestoreLimit, startAfter } from 'firebase/firestore';
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, isWithinInterval } from 'date-fns';

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
  console.log("OrderService: Fetching all orders from Firestore for admin.");
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
      console.log(`OrderService: Order found for ID ${orderId}.`);
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
  const q = query(ordersCollectionRef, orderBy('orderTimestamp', 'desc'), firestoreLimit(5000)); // Increased limit for safety
  const querySnapshot = await getDocs(q);

  let maxNumericId = 0;
  querySnapshot.docs.forEach(docSnap => {
    const docId = docSnap.id;
    if (docId && typeof docId === 'string' && docId.startsWith('o')) {
      const numericPart = parseInt(docId.substring(1), 10);
      if (!isNaN(numericPart) && numericPart > maxNumericId) {
        maxNumericId = numericPart;
      }
    }
  });
  const newId = `o${maxNumericId + 1}`;
  console.log(`OrderService (getNextOrderId): Determined next order ID: ${newId}`);
  return newId;
}


export async function createOrderService(orderDetails: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes?: string;
  items: OrderItem[];
  totalAmount: number;
}): Promise<Order> {
  console.log('OrderService (createOrderService): Called for customer phone:', orderDetails.customerPhone);
  const currentTimestamp = Timestamp.fromDate(new Date());

  const customerPhoneTrimmed = String(orderDetails.customerPhone || '').trim();
  if (!customerPhoneTrimmed) {
    console.error("OrderService (createOrderService): Customer phone is empty or invalid.");
    throw new Error("Customer phone is required.");
  }

  const newOrderId = await getNextOrderId();
  console.log(`OrderService (createOrderService): Generated new order ID: ${newOrderId}`);

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
  console.log(`OrderService (createOrderService): Preparing to save new order ${newOrderId}. Customer details: Name='${orderDetails.customerName}', Phone='${customerPhoneTrimmed}'`);

  try {
    const customerDocRef = doc(db, 'customers', customerPhoneTrimmed);
    console.log(`OrderService (createOrderService): Attempting transaction for customer document: ${customerPhoneTrimmed}`);

    await runTransaction(db, async (transaction) => {
      const customerDocSnap = await transaction.get(customerDocRef);
      if (!customerDocSnap.exists()) {
        const newCustomerData: CustomerSummary = {
          id: customerPhoneTrimmed,
          name: orderDetails.customerName,
          phone: customerPhoneTrimmed,
          firstOrderDate: currentTimestamp.toDate(),
          lastOrderDate: currentTimestamp.toDate(),
          totalOrders: 1,
          totalSpent: 0, // Initial totalSpent is 0 for new customers
          latestAddress: orderDetails.customerAddress,
          generalAgentNotes: '',
        };
        transaction.set(customerDocRef, newCustomerData);
        console.log(`OrderService (createOrderService): Created NEW customer document for ${customerPhoneTrimmed} with data:`, newCustomerData);
      } else {
        const existingCustomerData = customerDocSnap.data() as CustomerSummary;
        const existingCustomerName = existingCustomerData.name;

        if (orderDetails.customerName !== existingCustomerName) {
            agentNoteForNameDiscrepancy = `הערת מערכת: שם בהזמנה זו ('${orderDetails.customerName}') שונה מהשם הרשום ללקוח זה ('${existingCustomerName}').`;
            console.log(`OrderService (createOrderService): Customer name mismatch for phone ${customerPhoneTrimmed}. Order name: '${orderDetails.customerName}', Stored name: '${existingCustomerName}'. Agent note will be added.`);
        }

        const updatedCustomerData: any = {
          lastOrderDate: currentTimestamp.toDate(),
          totalOrders: increment(1),
          latestAddress: orderDetails.customerAddress,
          // name: orderDetails.customerName, // Do not update name here, keep original name
        };
        if (!existingCustomerData.firstOrderDate) {
            updatedCustomerData.firstOrderDate = currentTimestamp.toDate();
        }
        // totalSpent is updated only when an order is 'completed'.

        transaction.update(customerDocRef, updatedCustomerData);
        console.log(`OrderService (createOrderService): UPDATED existing customer document for ${customerPhoneTrimmed}. Update data (excluding totalSpent and name):`, updatedCustomerData);
      }
    });

    if (agentNoteForNameDiscrepancy) {
        newOrderData.agentNotes = (newOrderData.agentNotes ? newOrderData.agentNotes + "\n\n" : "") + agentNoteForNameDiscrepancy;
    }

    const newOrderDocRefWithId = doc(db, 'orders', newOrderId);
    await setDoc(newOrderDocRefWithId, newOrderData);
    console.log("OrderService (createOrderService): Order created with ID: ", newOrderId, "and data:", newOrderData);

    const createdOrder: Order = {
        id: newOrderId,
        ...newOrderData,
    };
    return createdOrder;

  } catch (error) {
    console.error("OrderService (createOrderService): Error creating order in Firestore:", error);
    throw error;
  }
}


export async function updateOrderStatusService(orderId: string, newStatus: Order['status']): Promise<Order | null> {
  console.log(`OrderService: Updating order status for ID: ${orderId} to ${newStatus} in Firestore.`);
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderDocRef);

    if (!orderSnap.exists()) {
      console.error(`OrderService: Order ${orderId} not found for status update.`);
      return null;
    }

    const currentOrder = orderFromDoc(orderSnap);
    const oldStatus = currentOrder.status;
    const orderAmount = currentOrder.totalAmount;

    const updateData: Partial<Order> = { status: newStatus };
    if (newStatus === 'received' || newStatus === 'completed' || newStatus === 'cancelled') {
      updateData.isViewedByAgent = true;
    }

    await updateDoc(orderDocRef, updateData as any);
    console.log(`OrderService: Order ${orderId} status updated to ${newStatus}.`);

    const customerPhone = String(currentOrder.customerPhone).trim();
    if (customerPhone) {
      const customerDocRef = doc(db, 'customers', customerPhone);
      const customerSnap = await getDoc(customerDocRef);

      if (customerSnap.exists()) {
        let amountChange = 0;
        if (newStatus === 'completed' && oldStatus !== 'completed') {
          amountChange = orderAmount;
          console.log(`OrderService: Order ${orderId} completed. Adding ${orderAmount} to customer ${customerPhone}'s totalSpent.`);
        } else if (oldStatus === 'completed' && newStatus !== 'completed') {
          amountChange = -orderAmount;
          console.log(`OrderService: Order ${orderId} no longer completed. Subtracting ${orderAmount} from customer ${customerPhone}'s totalSpent.`);
        }

        if (amountChange !== 0) {
          await updateDoc(customerDocRef, { totalSpent: increment(amountChange) });
          console.log(`OrderService: Updated customer ${customerPhone}'s totalSpent by ${amountChange}.`);
        }
      } else {
        console.warn(`OrderService: Customer document not found for phone ${customerPhone} when trying to update totalSpent.`);
      }
    }

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
  console.log("OrderService (getUniqueCustomers): Fetching customers from 'customers' collection in Firestore.");
  try {
    const customersCollectionRef = collection(db, 'customers');
    const q = query(customersCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    const customers = querySnapshot.docs.map(docSnap => customerSummaryFromDoc(docSnap));
    console.log(`OrderService (getUniqueCustomers): Fetched ${customers.length} customers from 'customers' collection.`);
    return customers;
  } catch (error) {
    console.error("OrderService (getUniqueCustomers): Error fetching customers from 'customers' collection:", error);
    return [];
  }
}


export async function getOrdersByCustomerPhone(phone: string): Promise<Order[]> {
  const cleanedPhoneInput = String(phone || '').trim();
  console.log(`OrderService (getOrdersByCustomerPhone): Querying orders for phone (service): >>${cleanedPhoneInput}<< (Type: ${typeof cleanedPhoneInput})`);

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
    console.log(`OrderService (getOrdersByCustomerPhone): Executing Firestore query for phone: ${cleanedPhoneInput}`);
    const querySnapshot = await getDocs(q);
    
    console.log(`OrderService (getOrdersByCustomerPhone): Query for phone ${cleanedPhoneInput} returned ${querySnapshot.docs.length} documents from Firestore.`);

    if (querySnapshot.empty) {
      console.log(`OrderService (getOrdersByCustomerPhone): No orders found for phone ${cleanedPhoneInput}.`);
      return [];
    }

    const orders: Order[] = [];
    querySnapshot.forEach(docSnap => {
        const orderData = orderFromDoc(docSnap);
        // Additional log to verify data being processed
        console.log(`OrderService (getOrdersByCustomerPhone): Processing order doc ID: ${docSnap.id}, customerPhone in doc: ${orderData.customerPhone}`);
        orders.push(orderData);
    });

    console.log(`OrderService (getOrdersByCustomerPhone): Found ${orders.length} orders for phone ${cleanedPhoneInput}. Orders Data (first 3):`, orders.slice(0,3).map(o => ({id: o.id, customerName: o.customerName, customerPhoneInOrder: o.customerPhone, status: o.status, totalAmount: o.totalAmount })));
    return orders;
  } catch (error: any) {
    console.error(`OrderService (getOrdersByCustomerPhone): Error fetching orders for customer phone ${cleanedPhoneInput}. Firestore error code: ${error.code}, message: ${error.message}. Stack: ${error.stack}`);
    console.error("Detailed Firestore error object:", error);
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
    console.warn(`OrderService: Customer document not found for ID ${cleanedCustomerId} after attempting to update general notes.`);
    return null;
  } catch (err) {
    console.error(`OrderService: Error updating general agent notes for ${cleanedCustomerId} in Firestore:`, err);
    return null;
  }
}

export async function getTopCustomers(limitAmount: number = 3): Promise<CustomerSummary[]> {
  console.log(`OrderService (getTopCustomers): Fetching top ${limitAmount} customers by totalSpent.`);
  try {
    const customersCollectionRef = collection(db, 'customers');
    const q = query(customersCollectionRef, orderBy('totalSpent', 'desc'), firestoreLimit(limitAmount));
    const querySnapshot = await getDocs(q);
    const topCustomers = querySnapshot.docs.map(docSnap => customerSummaryFromDoc(docSnap));
    console.log(`OrderService (getTopCustomers): Fetched ${topCustomers.length} top customers.`);
    return topCustomers;
  } catch (error) {
    console.error("OrderService (getTopCustomers): Error fetching top customers:", error);
    return [];
  }
}

export async function getRecentOrders(daysAgo: number = 7): Promise<Order[]> {
  console.log(`OrderService (getRecentOrders): Fetching orders from the last ${daysAgo} days.`);
  try {
    const ordersCollectionRef = collection(db, 'orders');
    const startDate = startOfDay(subDays(new Date(), daysAgo -1)); 
    const endDate = endOfDay(new Date());
    
    const q = query(
      ordersCollectionRef, 
      where('orderTimestamp', '>=', Timestamp.fromDate(startDate)),
      where('orderTimestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('orderTimestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const recentOrders = querySnapshot.docs.map(docSnap => orderFromDoc(docSnap));
    console.log(`OrderService (getRecentOrders): Fetched ${recentOrders.length} orders from the last ${daysAgo} days.`);
    return recentOrders;
  } catch (error) {
    console.error(`OrderService (getRecentOrders): Error fetching recent orders:`, error);
    return [];
  }
}

export async function getNewCustomersThisMonthCount(): Promise<number> {
  console.log("OrderService (getNewCustomersThisMonthCount): Fetching count of new customers this month.");
  try {
    const customersCollectionRef = collection(db, 'customers');
    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const lastDayOfMonth = endOfMonth(now);

    const q = query(
      customersCollectionRef,
      where('firstOrderDate', '>=', Timestamp.fromDate(firstDayOfMonth)),
      where('firstOrderDate', '<=', Timestamp.fromDate(lastDayOfMonth))
    );
    const querySnapshot = await getDocs(q);
    console.log(`OrderService (getNewCustomersThisMonthCount): Fetched ${querySnapshot.size} new customers this month.`);
    return querySnapshot.size;
  } catch (error) {
    console.error("OrderService (getNewCustomersThisMonthCount): Error fetching new customers count:", error);
    return 0;
  }
}
    