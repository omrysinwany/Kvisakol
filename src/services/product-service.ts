
'use server';

import type { Product } from '@/lib/types';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

// Helper function to convert Firestore doc data to Product, ensuring all fields exist
const productFromDoc = (docSnap: any): Product => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || '',
    description: data.description || '',
    price: data.price !== undefined ? Number(data.price) : 0,
    imageUrl: data.imageUrl || 'https://placehold.co/300x300.png',
    dataAiHint: data.dataAiHint || '',
    category: data.category || '',
    isActive: data.isActive !== undefined ? data.isActive : false,
  };
};

export async function getProductsForCatalog(): Promise<Product[]> {
  console.log("Fetching active products from Firestore for catalog.");
  try {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, where('isActive', '==', true), orderBy('name'));
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(docSnap => productFromDoc(docSnap));
    console.log(`Fetched ${products.length} active products from Firestore.`);
    return products;
  } catch (error) {
    console.error("Error fetching active products from Firestore:", error);
    return [];
  }
}

export async function getAllProductsForAdmin(): Promise<Product[]> {
  console.log("Fetching all products from Firestore for admin.");
  try {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(docSnap => productFromDoc(docSnap));
    console.log(`Fetched ${products.length} products from Firestore for admin.`);
    return products;
  } catch (error) {
    console.error("Error fetching all products from Firestore for admin:", error);
    return [];
  }
}

export async function getProductById(productId: string): Promise<Product | null> {
  console.log(`Fetching product with ID: ${productId} from Firestore.`);
  try {
    const productDocRef = doc(db, 'products', productId);
    const docSnap = await getDoc(productDocRef);
    if (docSnap.exists()) {
      return productFromDoc(docSnap);
    } else {
      console.log("No such product document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching product by ID from Firestore:", error);
    return null;
  }
}

export async function createProductService(productData: Omit<Product, 'id' | 'dataAiHint'> & { imageUrl?: string }): Promise<Product> {
  console.log("Creating product in Firestore:", productData);
  try {
    const productToCreate = {
      name: productData.name,
      description: productData.description,
      price: Number(productData.price),
      category: productData.category || '',
      isActive: productData.isActive !== undefined ? productData.isActive : true,
      imageUrl: productData.imageUrl || 'https://placehold.co/600x400.png',
      dataAiHint: 'custom product' // Default hint
    };
    const docRef = await addDoc(collection(db, 'products'), productToCreate);
    console.log("Product created with ID: ", docRef.id);
    return { ...productToCreate, id: docRef.id };
  } catch (error) {
    console.error("Error creating product in Firestore:", error);
    throw error; // Re-throw to be caught by caller
  }
}

export async function updateProductService(productId: string, productData: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
  console.log(`Updating product with ID: ${productId} in Firestore:`, productData);
  try {
    const productDocRef = doc(db, 'products', productId);
    // Ensure price is a number if provided
    const dataToUpdate: Partial<Product> = { ...productData };
    if (dataToUpdate.price !== undefined) {
      dataToUpdate.price = Number(dataToUpdate.price);
    }
    await updateDoc(productDocRef, dataToUpdate);
    const updatedDocSnap = await getDoc(productDocRef);
    if (updatedDocSnap.exists()) {
      return productFromDoc(updatedDocSnap);
    }
    return null;
  } catch (error) {
    console.error("Error updating product in Firestore:", error);
    return null;
  }
}

export async function deleteProductService(productId: string): Promise<boolean> {
  console.log(`Deleting product with ID: ${productId} from Firestore.`);
  try {
    const productDocRef = doc(db, 'products', productId);
    await deleteDoc(productDocRef);
    return true;
  } catch (error) {
    console.error("Error deleting product from Firestore:", error);
    return false;
  }
}

export async function toggleProductActiveStatusService(productId: string, isActive: boolean): Promise<Product | null> {
  console.log(`Toggling active status for product ID: ${productId} to ${isActive} in Firestore.`);
  try {
    const productDocRef = doc(db, 'products', productId);
    await updateDoc(productDocRef, { isActive });
    const updatedDocSnap = await getDoc(productDocRef);
    if (updatedDocSnap.exists()) {
      return productFromDoc(updatedDocSnap);
    }
    return null;
  } catch (error) {
    console.error("Error toggling product active status in Firestore:", error);
    return null;
  }
}
