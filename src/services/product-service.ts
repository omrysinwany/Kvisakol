'use server';

import type { Product } from '@/lib/types';
// import {
//   placeholderProducts, // Removed import for fetching
//   addPlaceholderProduct,
//   updatePlaceholderProduct as updateLocalProduct,
//   deletePlaceholderProduct as deleteLocalProduct
// } from '@/lib/placeholder-data'; // Keep imports for mutations for now

import { db } from '@/lib/firebase/config'; // Import the Firestore DB instance
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'; // Import Firestore functions

// Helper function to simulate async behavior (can be removed if not needed anymore for actual fetch)
// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getProductsForCatalog(): Promise<Product[]> {
  console.log("Fetching active products from Firestore for catalog.");
  try {
    // Create a query to get active products, ordered by name
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('isActive', '==', true), orderBy('name', 'asc')); // Filter by isActive and order by name

    const querySnapshot = await getDocs(q);

    const activeProducts: Product[] = [];
    querySnapshot.forEach((doc) => {
      // Map document data to the Product type, including the doc.id
      const productData = doc.data();
      activeProducts.push({
        id: doc.id, // Use document ID as product ID
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category || '', // Handle potential missing category
        isActive: productData.isActive,
        imageUrl: productData.imageUrl || '', // Handle potential missing imageUrl
        dataAiHint: productData.dataAiHint || '', // Handle potential missing dataAiHint
        // Add other fields if necessary based on your Product type and Firestore data
      } as Product); // Cast to Product type
    });

    console.log(`Fetched ${activeProducts.length} active products from Firestore.`);
    return activeProducts; // Return the fetched and mapped products
  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    // Re-throw the error so the calling component can catch it
    throw new Error('Failed to fetch products from Firestore');
  }
}

// TODO: The following functions currently use placeholder data and need to be updated to use Firebase Firestore.

import {
    placeholderProducts,
    addPlaceholderProduct,
    updatePlaceholderProduct as updateLocalProduct,
    deletePlaceholderProduct as deleteLocalProduct
  } from '@/lib/placeholder-data';

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export async function getAllProductsForAdmin(): Promise<Product[]> {
  await delay(100); // Simulate network delay
  console.log("Fetching all products from placeholder data for admin.");
  const sortedProducts = [...placeholderProducts].sort((a, b) => a.name.localeCompare(b.name, 'he'));
  console.log(`Fetched ${sortedProducts.length} products from placeholder data for admin.`);
  return JSON.parse(JSON.stringify(sortedProducts)); // Deep clone
}

export async function getProductById(productId: string): Promise<Product | null> {
  await delay(100); // Simulate network delay
  console.log(`Fetching product with ID: ${productId} from placeholder data.`);
  const product = placeholderProducts.find(p => p.id === productId);
  if (product) {
    return JSON.parse(JSON.stringify(product)); // Deep clone
  }
  console.log("No such product document in placeholder data!");
  return null;
}

export async function createProductService(productData: Omit<Product, 'id' | 'dataAiHint'> & { imageUrl?: string }): Promise<Product> {
  await delay(100); // Simulate network delay
  console.log("Creating product in placeholder data:", productData);
  const newProduct: Product = {
    id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More robust unique ID for placeholder
    name: productData.name,
    description: productData.description,
    price: Number(productData.price),
    category: productData.category || '',
    isActive: productData.isActive !== undefined ? productData.isActive : true,
    imageUrl: productData.imageUrl || 'https://placehold.co/600x400.png',
    dataAiHint: 'custom product' // Default hint
  };
  addPlaceholderProduct(newProduct);
  console.log("Product created with ID: ", newProduct.id, "in placeholder data.");
  return JSON.parse(JSON.stringify(newProduct)); // Deep clone
}

export async function updateProductService(productId: string, productData: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
  await delay(100); // Simulate network delay
  console.log(`Updating product with ID: ${productId} in placeholder data:`, productData);
  const productIndex = placeholderProducts.findIndex(p => p.id === productId);
  if (productIndex !== -1) {
    const updatedProduct = {
      ...placeholderProducts[productIndex],
      ...productData,
      price: productData.price !== undefined ? Number(productData.price) : placeholderProducts[productIndex].price
    };
    updateLocalProduct(updatedProduct);
    console.log("Product updated in placeholder data.");
    return JSON.parse(JSON.stringify(updatedProduct)); // Deep clone
  }
  console.error("Error updating product in placeholder data: Product not found.");
  return null;
}

export async function deleteProductService(productId: string): Promise<boolean> {
  await delay(100); // Simulate network delay
  console.log(`Deleting product with ID: ${productId} from placeholder data.`);
  const initialLength = placeholderProducts.length;
  deleteLocalProduct(productId);
  const success = placeholderProducts.length < initialLength;
  if (success) {
    console.log("Product deleted from placeholder data.");
  } else {
    console.error("Error deleting product from placeholder data: Product not found or already deleted.");
  }
  return success;
}

export async function toggleProductActiveStatusService(productId: string, isActive: boolean): Promise<Product | null> {
  await delay(100); // Simulate network delay
  console.log(`Toggling active status for product ID: ${productId} to ${isActive} in placeholder data.`);
  const productIndex = placeholderProducts.findIndex(p => p.id === productId);
  if (productIndex !== -1) {
    const updatedProduct = { ...placeholderProducts[productIndex], isActive };
    updateLocalProduct(updatedProduct);
    console.log("Product active status toggled in placeholder data.");
    return JSON.parse(JSON.stringify(updatedProduct)); // Deep clone
  }
  console.error("Error toggling product active status in placeholder data: Product not found.");
  return null;
}
