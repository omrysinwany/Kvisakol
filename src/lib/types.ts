export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
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
  status: 'new' | 'processed' | 'shipped' | 'completed' | 'cancelled';
}
