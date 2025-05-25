
'use server';

import type { Product } from '@/lib/types';
import { 
  placeholderProducts,
  addPlaceholderProduct,
  updatePlaceholderProduct as updateLocalProduct,
  deletePlaceholderProduct as deleteLocalProduct 
} from '@/lib/placeholder-data';

// Helper function to simulate async behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getProductsForCatalog(): Promise<Product[]> {
  await delay(100); // Simulate network delay
  console.log("Fetching active products from placeholder data for catalog.");
  const activeProducts = placeholderProducts.filter(p => p.isActive).sort((a, b) => a.name.localeCompare(b.name, 'he'));
  console.log(`Fetched ${activeProducts.length} active products from placeholder data.`);
  return JSON.parse(JSON.stringify(activeProducts)); // Deep clone to prevent direct mutation issues
}

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
