
'use server';

import { placeholderProducts } from '@/lib/placeholder-data';
import type { Product } from '@/lib/types';

// Simulate API delay - useful for testing loading states
// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getProductsForCatalog(): Promise<Product[]> {
  // await delay(100); // Simulate network latency
  // For customer catalog, usually only active products
  return Promise.resolve(placeholderProducts.filter(p => p.isActive));
}

export async function getAllProductsForAdmin(): Promise<Product[]> {
  // await delay(100);
  // For admin, show all products
  return Promise.resolve([...placeholderProducts]);
}

export async function getProductById(productId: string): Promise<Product | null> {
  // await delay(50);
  const product = placeholderProducts.find(p => p.id === productId) || null;
  return Promise.resolve(product);
}

// In a real DB scenario, these CUD operations would interact with the database.
// For now, they will log and modify the in-memory array (which won't persist across reloads).

export async function createProductService(productData: Omit<Product, 'id' | 'imageUrl' | 'dataAiHint'> & { imageUrl?: string }): Promise<Product> {
  console.log('SERVICE: Simulating createProduct:', productData);
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: productData.name,
    description: productData.description,
    price: productData.price,
    category: productData.category,
    isActive: productData.isActive,
    imageUrl: productData.imageUrl || 'https://placehold.co/600x400.png',
    dataAiHint: 'custom product' // Or generate based on name/category
  };
  placeholderProducts.push(newProduct); // Modifies in-memory array
  return Promise.resolve(newProduct);
}

export async function updateProductService(productId: string, productData: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
  console.log('SERVICE: Simulating updateProduct:', productId, productData);
  const productIndex = placeholderProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    return Promise.resolve(null);
  }
  const updatedProductDetails = { ...placeholderProducts[productIndex], ...productData };
  placeholderProducts[productIndex] = updatedProductDetails; // Modifies in-memory array
  return Promise.resolve(updatedProductDetails);
}

export async function deleteProductService(productId: string): Promise<boolean> {
  console.log('SERVICE: Simulating deleteProduct:', productId);
  const initialLength = placeholderProducts.length;
  const index = placeholderProducts.findIndex(p => p.id === productId);
  if (index > -1) {
    placeholderProducts.splice(index, 1); // Modifies in-memory array
  }
  return Promise.resolve(placeholderProducts.length < initialLength);
}

export async function toggleProductActiveStatusService(productId: string, isActive: boolean): Promise<Product | null> {
  console.log('SERVICE: Simulating toggleProductActiveStatus:', productId, isActive);
  const productIndex = placeholderProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    return Promise.resolve(null);
  }
  placeholderProducts[productIndex].isActive = isActive; // Modifies in-memory array
  return Promise.resolve(placeholderProducts[productIndex]);
}
