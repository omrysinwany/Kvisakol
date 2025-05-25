
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  dataAiHint?: string;
  category?: string; // Optional: if filtering by category is needed later
  isActive: boolean; // For admin to toggle visibility
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtOrder: number; // Price at the time of order
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
  agentNotes?: string; // Added for internal agent notes
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  isSuperAdmin: boolean;
  displayName?: string;
}

export interface CustomerSummary {
  id: string; // Using phone number as ID for simplicity
  name: string;
  phone: string;
  lastOrderDate: Date;
  totalOrders: number;
  totalSpent: number;
  latestAddress?: string;
}
