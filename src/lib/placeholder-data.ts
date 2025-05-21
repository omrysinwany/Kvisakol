import type { Product, Order } from './types';

export const placeholderProducts: Product[] = [
  {
    id: 'p1',
    name: 'אבקת כביסה "כביסכל קלאסי"',
    description: 'אבקת כביסה איכותית לכל סוגי הבדים, בניחוח מרענן.',
    price: 39.90,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'laundry powder',
    category: 'אבקות כביסה',
    isActive: true,
  },
  {
    id: 'p2',
    name: 'ג\'ל כביסה "כביסכל עוצמתי"',
    description: 'ג\'ל מרוכז לניקוי יסודי והסרת כתמים קשים.',
    price: 49.90,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'laundry gel',
    category: 'ג\'לים לכביסה',
    isActive: true,
  },
  {
    id: 'p3',
    name: 'מרכך כביסה "כביסכל רכות מפנקת"',
    description: 'מרכך כביסה מרוכז המעניק רכות וניחוח לאורך זמן.',
    price: 29.90,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'fabric softener',
    category: 'מרככי כביסה',
    isActive: true,
  },
  {
    id: 'p4',
    name: 'מסיר כתמים "כביסכל נקודתי"',
    description: 'תרסיס להסרת כתמים יעילה לפני הכביסה.',
    price: 24.90,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'stain remover',
    category: 'מסירי כתמים',
    isActive: true,
  },
  {
    id: 'p5',
    name: 'כדוריות ריח "כביסכל פרש"',
    description: 'כדוריות ריח להוספה למכונת הכביסה לניחוח מתמשך.',
    price: 34.90,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'scent boosters',
    category: 'תוספי כביסה',
    isActive: false, // Example of inactive product
  },
];

export const placeholderOrders: Order[] = [
  {
    id: 'o1',
    customerName: 'ישראל ישראלי',
    customerPhone: '050-1234567',
    customerAddress: 'רחוב הראשי 1, תל אביב',
    items: [
      { productId: 'p1', productName: 'אבקת כביסה "כביסכל קלאסי"', quantity: 2, priceAtOrder: 39.90 },
      { productId: 'p3', productName: 'מרכך כביסה "כביסכל רכות מפנקת"', quantity: 1, priceAtOrder: 29.90 },
    ],
    totalAmount: 109.70,
    orderTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    status: 'new',
  },
  {
    id: 'o2',
    customerName: 'שרה לוי',
    customerPhone: '052-7654321',
    customerAddress: 'שדרות הפרחים 5, ירושלים',
    customerNotes: 'נא להשאיר ליד הדלת אם אין מענה',
    items: [
      { productId: 'p2', productName: 'ג\'ל כביסה "כביסכל עוצמתי"', quantity: 1, priceAtOrder: 49.90 },
    ],
    totalAmount: 49.90,
    orderTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Two days ago
    status: 'processed',
  },
  {
    id: 'o3',
    customerName: 'משה כהן',
    customerPhone: '054-1122333',
    customerAddress: 'דרך השלום 10, חיפה',
    items: [
      { productId: 'p1', productName: 'אבקת כביסה "כביסכל קלאסי"', quantity: 1, priceAtOrder: 39.90 },
      { productId: 'p2', productName: 'ג\'ל כביסה "כביסכל עוצמתי"', quantity: 1, priceAtOrder: 49.90 },
      { productId: 'p4', productName: 'מסיר כתמים "כביסכל נקודתי"', quantity: 3, priceAtOrder: 24.90 },
    ],
    totalAmount: 164.5,
    orderTimestamp: new Date(),
    status: 'completed',
  },
];
