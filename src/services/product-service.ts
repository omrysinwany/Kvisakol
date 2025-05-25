
'use server';

import { placeholderProducts, setPlaceholderProducts, addPlaceholderProduct, updatePlaceholderProduct, deletePlaceholderProduct } from '@/lib/placeholder-data';
import type { Product } from '@/lib/types';
import { db } from '@/lib/firebase/config'; // Ensure this path is correct
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Fetches active products from Firestore for the customer catalog
export async function getProductsForCatalog(): Promise<Product[]> {
  console.log("Attempting to fetch products from Firestore for catalog...");
  try {
    if (!db) {
      console.error("Firestore db instance is not available in getProductsForCatalog.");
      return []; // Or fallback to placeholder data
    }
    const productsCollectionRef = collection(db, 'products');
    const q = query(productsCollectionRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No active products found in Firestore for catalog.");
      // Optionally, return placeholder data if Firestore is empty for demonstration
      // console.log("Falling back to placeholder products for catalog as Firestore is empty.");
      // return placeholderProducts.filter(p => p.isActive);
      return [];
    }
    
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
    console.log(`Fetched ${products.length} active products from Firestore for catalog.`);
    return products;
  } catch (error) {
    console.error("Error fetching products from Firestore for catalog:", error);
    // Fallback to placeholder data or return empty array in case of error
    // console.log("Falling back to placeholder products for catalog due to error.");
    // return placeholderProducts.filter(p => p.isActive);
    return []; 
  }
}

// Fetches all products from Firestore for the admin panel
export async function getAllProductsForAdmin(): Promise<Product[]> {
  console.log("Attempting to fetch all products from Firestore for admin...");
  try {
    if (!db) {
      console.error("Firestore db instance is not available in getAllProductsForAdmin.");
      // Fallback to placeholder data if Firestore is not available
      console.log("Falling back to all placeholder products for admin as Firestore db is not available.");
      return [...placeholderProducts];
    }
    const productsCollectionRef = collection(db, 'products');
    const querySnapshot = await getDocs(productsCollectionRef);

    if (querySnapshot.empty) {
      console.log("No products found in Firestore for admin.");
      // Optionally, return placeholder data if Firestore is empty for demonstration
      // console.log("Falling back to all placeholder products for admin as Firestore is empty.");
      // return [...placeholderProducts];
      return [];
    }

    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
    console.log(`Fetched ${products.length} products from Firestore for admin.`);
    return products;
  } catch (error) {
    console.error("Error fetching all products from Firestore for admin:", error);
    // Fallback to placeholder data or return empty array in case of error
    // console.log("Falling back to all placeholder products for admin due to error.");
    // return [...placeholderProducts];
    return [];
  }
}

// Fetches a single product by ID from Firestore
export async function getProductById(productId: string): Promise<Product | null> {
  console.log(`Attempting to fetch product with ID: ${productId} from Firestore...`);
  try {
    if (!db) {
      console.error("Firestore db instance is not available in getProductById.");
      return null;
    }
    const productDocRef = doc(db, 'products', productId);
    const docSnap = await getDoc(productDocRef);

    if (docSnap.exists()) {
      const product = { id: docSnap.id, ...docSnap.data() } as Product;
      console.log("Product fetched from Firestore:", product);
      return product;
    } else {
      console.log(`No product found in Firestore with ID: ${productId}.`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching product with ID ${productId} from Firestore:`, error);
    return null;
  }
}

// Creates a new product in Firestore
export async function createProductService(productData: Omit<Product, 'id' | 'dataAiHint'> & { imageUrl?: string }): Promise<Product> {
  console.log("Attempting to create product in Firestore:", productData);
  try {
    if (!db) {
      console.error("Firestore db instance is not available in createProductService.");
      // Simulate error or throw
      throw new Error("Firestore is not available");
    }
    const newProductPayload = {
      name: productData.name,
      description: productData.description,
      price: Number(productData.price), // Ensure price is a number
      category: productData.category || '',
      isActive: productData.isActive,
      imageUrl: productData.imageUrl || 'https://placehold.co/600x400.png', // Default placeholder
      dataAiHint: 'custom product' // Generic hint or generate one if needed
    };

    const docRef = await addDoc(collection(db, "products"), newProductPayload);
    const newProduct: Product = {
      id: docRef.id,
      ...newProductPayload
    };
    console.log("Product created in Firestore with ID:", newProduct.id);
    return newProduct;
  } catch (error) {
    console.error("Error creating product in Firestore:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Updates an existing product in Firestore
export async function updateProductService(productId: string, productData: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
  console.log(`Attempting to update product with ID: ${productId} in Firestore:`, productData);
  try {
    if (!db) {
      console.error("Firestore db instance is not available in updateProductService.");
      return null;
    }
    const productDocRef = doc(db, 'products', productId);
    
    // Ensure price is a number if it's being updated
    const updatePayload = { ...productData };
    if (updatePayload.price !== undefined) {
      updatePayload.price = Number(updatePayload.price);
    }

    await updateDoc(productDocRef, updatePayload);
    console.log(`Product with ID: ${productId} updated in Firestore.`);
    // Fetch the updated product to return it
    const updatedDocSnap = await getDoc(productDocRef);
    if (updatedDocSnap.exists()) {
      return { id: updatedDocSnap.id, ...updatedDocSnap.data() } as Product;
    }
    return null; // Should not happen if update was successful
  } catch (error) {
    console.error(`Error updating product with ID ${productId} in Firestore:`, error);
    return null;
  }
}

// Deletes a product from Firestore
export async function deleteProductService(productId: string): Promise<boolean> {
  console.log(`Attempting to delete product with ID: ${productId} from Firestore.`);
  try {
    if (!db) {
      console.error("Firestore db instance is not available in deleteProductService.");
      return false;
    }
    const productDocRef = doc(db, 'products', productId);
    await deleteDoc(productDocRef);
    console.log(`Product with ID: ${productId} deleted from Firestore.`);
    return true;
  } catch (error) {
    console.error(`Error deleting product with ID ${productId} from Firestore:`, error);
    return false;
  }
}

// Toggles the active status of a product in Firestore
export async function toggleProductActiveStatusService(productId: string, isActive: boolean): Promise<Product | null> {
  console.log(`Attempting to toggle active status for product ID: ${productId} to ${isActive} in Firestore.`);
  try {
    if (!db) {
      console.error("Firestore db instance is not available in toggleProductActiveStatusService.");
      return null;
    }
    const productDocRef = doc(db, 'products', productId);
    await updateDoc(productDocRef, { isActive });
    console.log(`Active status for product ID: ${productId} toggled to ${isActive} in Firestore.`);
    // Fetch the updated product
    const updatedDocSnap = await getDoc(productDocRef);
    if (updatedDocSnap.exists()) {
      return { id: updatedDocSnap.id, ...updatedDocSnap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error(`Error toggling active status for product ID ${productId} in Firestore:`, error);
    return null;
  }
}
