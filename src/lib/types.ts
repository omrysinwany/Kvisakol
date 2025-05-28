
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  dataAiHint?: string;
  category?: string; 
  isActive: boolean;
  unitsPerBox: number; // כמות יחידות בארגז
  consumerPrice: number; // מחיר לצרכן
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtOrder: number; 
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes?: string;
  items: OrderItem[];
  totalAmount: number;
  orderTimestamp: Date;
  status: 'new' | 'received' | 'completed' | 'cancelled';
  isViewedByAgent?: boolean;
  agentNotes?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  isSuperAdmin: boolean;
  displayName?: string;
}

export interface CustomerSummary {
  id: string; 
  name: string;
  phone: string;
  firstOrderDate?: Date; 
  lastOrderDate: Date;
  totalOrders: number;
  totalSpent: number;
  latestAddress?: string;
  generalAgentNotes?: string; // Added new field
}
