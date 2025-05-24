
'use server';

import { placeholderOrders, setPlaceholderOrders } from '@/lib/placeholder-data';
import type { Order, OrderItem } from '@/lib/types';

// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getOrdersForAdmin(): Promise<Order[]> {
  // await delay(100);
  // Sort by newest first for admin view
  const sortedOrders = [...placeholderOrders].sort((a, b) =>
    new Date(b.orderTimestamp).getTime() - new Date(a.orderTimestamp).getTime()
  );
  return Promise.resolve(sortedOrders);
}

export async function getOrderByIdForAdmin(orderId: string): Promise<Order | null> {
  // await delay(50);
  const order = placeholderOrders.find(o => o.id === orderId) || null;
  return Promise.resolve(order);
}

export async function createOrderService(orderDetails: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes?: string;
  items: OrderItem[]; 
  totalAmount: number;
}): Promise<Order> {
  console.log('SERVICE: Simulating createOrder:', orderDetails);
  const newOrder: Order = {
    id: `KV-${Date.now().toString().slice(-6)}`,
    customerName: orderDetails.customerName,
    customerPhone: orderDetails.customerPhone,
    customerAddress: orderDetails.customerAddress,
    customerNotes: orderDetails.customerNotes,
    items: orderDetails.items,
    totalAmount: orderDetails.totalAmount,
    orderTimestamp: new Date(),
    status: 'new',
    isViewedByAgent: false, 
  };
  
  const currentOrders = [...placeholderOrders];
  currentOrders.unshift(newOrder);
  setPlaceholderOrders(currentOrders); 

  return Promise.resolve(newOrder);
}

export async function updateOrderStatusService(orderId: string, newStatus: Order['status']): Promise<Order | null> {
  console.log('SERVICE: Simulating updateOrderStatus:', orderId, newStatus);
  const currentOrders = [...placeholderOrders];
  const orderIndex = currentOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return Promise.resolve(null);
  }
  currentOrders[orderIndex].status = newStatus; 
  
  // If status is no longer 'new' (e.g., 'received', 'completed', 'cancelled'), it's considered viewed.
  if (newStatus !== 'new') {
    currentOrders[orderIndex].isViewedByAgent = true;
  }
  // Specifically if it's 'received', it's definitely viewed.
  if (newStatus === 'received') {
    currentOrders[orderIndex].isViewedByAgent = true;
  }

  setPlaceholderOrders(currentOrders);
  return Promise.resolve(currentOrders[orderIndex]);
}

export async function markOrderAsViewedService(orderId: string): Promise<Order | null> {
  console.log('SERVICE: Simulating markOrderAsViewed:', orderId);
  const currentOrders = [...placeholderOrders];
  const orderIndex = currentOrders.findIndex(o => o.id === orderId);

  if (orderIndex === -1) {
    return Promise.resolve(null);
  }

  const order = currentOrders[orderIndex];
  order.isViewedByAgent = true;

  // If the order was 'new', change its status to 'received'
  if (order.status === 'new') {
    order.status = 'received';
  }
  
  setPlaceholderOrders(currentOrders);
  return Promise.resolve(order);
}

