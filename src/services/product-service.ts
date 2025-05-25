
'use server';

import { placeholderProducts, addPlaceholderProduct, updatePlaceholderProduct, deletePlaceholderProduct } from '@/lib/placeholder-data';
import type { Product } from '@/lib/types';
// import { db } from '@/lib/firebase/config'; // Firebase config is still here for future use
// import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetches active products from placeholder data for the customer catalog
export async function getProductsForCatalog(): Promise<Product[]> {
  await delay(50); // Simulate network delay
  console.log("Fetching active products from placeholder data for catalog.");
  return Promise.resolve(placeholderProducts.filter(p => p.isActive));
}

// Fetches all products from placeholder data for the admin panel
export async function getAllProductsForAdmin(): Promise<Product[]> {
  await delay(50); // Simulate network delay
  console.log("Fetching all products from placeholder data for admin.");
  return Promise.resolve([...placeholderProducts].sort((a,b) => a.name.localeCompare(b.name))); // Sort for admin view
}

// Fetches a single product by ID from placeholder data
export async function getProductById(productId: string): Promise<Product | null> {
  await delay(20); // Simulate network delay
  console.log(`Fetching product with ID: ${productId} from placeholder data.`);
  const product = placeholderProducts.find(p => p.id === productId) || null;
  return Promise.resolve(product);
}

// Creates a new product in placeholder data
export async function createProductService(productData: Omit<Product, 'id' | 'dataAiHint'> & { imageUrl?: string }): Promise<Product> {
  await delay(100); // Simulate network delay
  console.log("Creating product in placeholder data:", productData);
  
  const newProduct: Product = {
    id: `prod-${Date.now().toString().slice(-6)}`, // Simple ID generation
    name: productData.name,
    description: productData.description,
    price: Number(productData.price),
    category: productData.category || '',
    isActive: productData.isActive !== undefined ? productData.isActive : true,
    imageUrl: productData.imageUrl || 'https://placehold.co/600x400.png',
    dataAiHint: 'custom product' // You might want to generate this or leave it optional
  };

  addPlaceholderProduct(newProduct);
  return Promise.resolve(newProduct);
}

// Updates an existing product in placeholder data
export async function updateProductService(productId: string, productData: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
  await delay(100); // Simulate network delay
  console.log(`Updating product with ID: ${productId} in placeholder data:`, productData);
  
  const productIndex = placeholderProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    return Promise.resolve(null);
  }

  const updatedProductDetails = {
    ...placeholderProducts[productIndex],
    ...productData,
    price: productData.price !== undefined ? Number(productData.price) : placeholderProducts[productIndex].price,
  };
  
  updatePlaceholderProduct(updatedProductDetails);
  return Promise.resolve(updatedProductDetails);
}

// Deletes a product from placeholder data
export async function deleteProductService(productId: string): Promise<boolean> {
  await delay(100); // Simulate network delay
  console.log(`Deleting product with ID: ${productId} from placeholder data.`);
  
  const initialLength = placeholderProducts.length;
  deletePlaceholderProduct(productId);
  const success = placeholderProducts.length < initialLength;
  return Promise.resolve(success);
}

// Toggles the active status of a product in placeholder data
export async function toggleProductActiveStatusService(productId: string, isActive: boolean): Promise<Product | null> {
  await delay(50); // Simulate network delay
  console.log(`Toggling active status for product ID: ${productId} to ${isActive} in placeholder data.`);
  
  const productIndex = placeholderProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    return Promise.resolve(null);
  }

  const updatedProduct = {
    ...placeholderProducts[productIndex],
    isActive: isActive,
  };
  
  updatePlaceholderProduct(updatedProduct);
  return Promise.resolve(updatedProduct);
}
