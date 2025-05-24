
'use server';

import { placeholderOrders } from '@/lib/placeholder-data';
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
  items: OrderItem[]; // Ensure items are OrderItem[], not CartItem[]
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
  };
  // In a real DB, this would be an insert operation.
  // For placeholder, to see it in admin immediately (won't persist page reload):
  placeholderOrders.unshift(newOrder); 
  return Promise.resolve(newOrder);
}

export async function updateOrderStatusService(orderId: string, newStatus: Order['status']): Promise<Order | null> {
  console.log('SERVICE: Simulating updateOrderStatus:', orderId, newStatus);
  const orderIndex = placeholderOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return Promise.resolve(null);
  }
  placeholderOrders[orderIndex].status = newStatus; // Modifies in-memory array
  return Promise.resolve(placeholderOrders[orderIndex]);
}
