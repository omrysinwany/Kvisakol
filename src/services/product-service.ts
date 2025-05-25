
'use server';

import { placeholderProducts, setPlaceholderProducts, addPlaceholderProduct, updatePlaceholderProduct, deletePlaceholderProduct } from '@/lib/placeholder-data';
import type { Product } from '@/lib/types';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Example of fetching products from Firestore for the catalog
export async function getProductsForCatalog(): Promise<Product[]> {
  try {
    const productsCollectionRef = collection(db, 'products');
    const q = query(productsCollectionRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
    return products;
  } catch (error) {
    console.error("Error fetching products from Firestore for catalog:", error);
    // Fallback to placeholder data or return empty array in case of error
    // For now, returning empty array to indicate failure to fetch from DB
    return []; 
  }
}

// --- Functions below still use placeholder data and need to be updated for Firestore ---

export async function getAllProductsForAdmin(): Promise<Product[]> {
  // TODO: Update to fetch all products from Firestore
  console.warn("getAllProductsForAdmin is using placeholder data. Update for Firestore.");
  return Promise.resolve([...placeholderProducts]);
}

export async function getProductById(productId: string): Promise<Product | null> {
  // TODO: Update to fetch a single product by ID from Firestore
  console.warn(`getProductById for ${productId} is using placeholder data. Update for Firestore.`);
  const product = placeholderProducts.find(p => p.id === productId) || null;
  return Promise.resolve(product);
}

export async function createProductService(productData: Omit<Product, 'id' | 'imageUrl' | 'dataAiHint'> & { imageUrl?: string }): Promise<Product> {
  // TODO: Update to create a product in Firestore
  console.warn("createProductService is using placeholder data. Update for Firestore.");
  const newProductData = {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    category: productData.category,
    isActive: productData.isActive,
    imageUrl: productData.imageUrl || '/images/products/placeholder.jpg', // Ensure a default image
    dataAiHint: 'custom product'
  };
  
  // Simulate adding to Firestore and getting an ID, then add to placeholder for now
  const docRef = await addDoc(collection(db, "products_placeholder_demo"), newProductData); // Example, not real "products" collection
  
  const newProduct: Product = {
    id: docRef.id, // Use ID from Firestore for demo
    ...newProductData
  };
  addPlaceholderProduct(newProduct); // Add to in-memory array for other functions to see it
  return Promise.resolve(newProduct);
}

export async function updateProductService(productId: string, productData: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
  // TODO: Update to update a product in Firestore
  console.warn(`updateProductService for ${productId} is using placeholder data. Update for Firestore.`);
  const productIndex = placeholderProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    return Promise.resolve(null);
  }
  const updatedProductDetails = { ...placeholderProducts[productIndex], ...productData };
  updatePlaceholderProduct(updatedProductDetails); // Modifies in-memory array
  return Promise.resolve(updatedProductDetails);
}

export async function deleteProductService(productId: string): Promise<boolean> {
  // TODO: Update to delete a product from Firestore
  console.warn(`deleteProductService for ${productId} is using placeholder data. Update for Firestore.`);
  const initialLength = placeholderProducts.length;
  deletePlaceholderProduct(productId); // Modifies in-memory array
  return Promise.resolve(placeholderProducts.length < initialLength);
}

export async function toggleProductActiveStatusService(productId: string, isActive: boolean): Promise<Product | null> {
  // TODO: Update to toggle product active status in Firestore
  console.warn(`toggleProductActiveStatusService for ${productId} is using placeholder data. Update for Firestore.`);
  const productIndex = placeholderProducts.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    return Promise.resolve(null);
  }
  placeholderProducts[productIndex].isActive = isActive; // Modifies in-memory array
  return Promise.resolve(placeholderProducts[productIndex]);
}
