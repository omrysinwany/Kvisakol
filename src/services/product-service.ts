'use server';

import type { Product } from '@/lib/types';
// import { // Removed import for fetching
//   placeholderProducts, // Removed import for fetching
//   addPlaceholderProduct,
//   updatePlaceholderProduct as updateLocalProduct,
//   deletePlaceholderProduct as deleteLocalProduct
// } from '@/lib/placeholder-data'; // Keep imports for mutations for now

import { db } from '@/lib/firebase/config'; // Import the Firestore DB instance
import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, DocumentReference, updateDoc, deleteDoc } from 'firebase/firestore'; // Import Firestore functions

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
        unitsPerBox: productData.unitsPerBox || 1, // Include unitsPerBox with default 1
        consumerPrice: productData.consumerPrice || 0, // Include consumerPrice with default to price
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
  console.log("Fetching all products from Firestore for admin.");
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('name', 'asc')); // Order by name

    const querySnapshot = await getDocs(q);

    const allProducts: Product[] = [];
    querySnapshot.forEach((doc) => {
      const productData = doc.data();
      allProducts.push({
        id: doc.id,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category || '',
        isActive: productData.isActive,
        imageUrl: productData.imageUrl || '',
        dataAiHint: productData.dataAiHint || '',
        unitsPerBox: productData.unitsPerBox || 1,
        consumerPrice: productData.consumerPrice || productData.price,
      } as Product);
    });
    console.log(`Fetched ${allProducts.length} products from Firestore for admin.`);
    return allProducts;
  } catch (error) {
    console.error("Error fetching all products from Firestore:", error);
    throw new Error('Failed to fetch all products from Firestore');
  }
}

export async function getProductById(productId: string): Promise<Product | null> {
  console.log(`Fetching product with ID: ${productId} from Firestore.`);
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const productData = productSnap.data();
      const product: Product = {
        id: productSnap.id,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category || '',
        isActive: productData.isActive,
        imageUrl: productData.imageUrl || '',
        dataAiHint: productData.dataAiHint || '',
        unitsPerBox: productData.unitsPerBox || 1,
        consumerPrice: productData.consumerPrice || productData.price,
      };
      console.log(`Fetched product with ID: ${productId} from Firestore.`);
      return product;
    } else {
      console.log(`No such product document with ID: ${productId} in Firestore.`);
      return null;
    }
  }
 catch (error) {
    console.error(`Error fetching product with ID ${productId} from Firestore:`, error);
    throw new Error(`Failed to fetch product with ID ${productId} from Firestore`);
  }
}

export async function createProductService(productData: Omit<Product, 'id' | 'dataAiHint'> & { imageUrl?: string }): Promise<Product> {
  console.log("Creating product in Firestore:", productData);
  try {
    const productsCollectionRef = collection(db, 'products');
    const docRef = await addDoc(productsCollectionRef, {
      name: productData.name,
      description: productData.description,
      price: Number(productData.price),
      category: productData.category || '',
      isActive: productData.isActive !== undefined ? productData.isActive : true,
      imageUrl: productData.imageUrl || 'https://placehold.co/600x400.png',
      dataAiHint: 'custom product', // Default hint as it's omitted from productData type
      unitsPerBox: productData.unitsPerBox || 1, // Include unitsPerBox with default 1
      consumerPrice: productData.consumerPrice || Number(productData.price), // Include consumerPrice with default to price
    });

    // Fetch the newly created document to return the complete Product object with the ID
    const newProductSnap = await getDoc(docRef);
    const newProductData = newProductSnap.data();
    const newProduct: Product = { id: newProductSnap.id, ...newProductData } as Product;
    console.log("Product created with ID: ", newProduct.id, "in Firestore.");
    return newProduct;
  } catch (error) {
    console.error("Error creating product in Firestore:", error);
    throw new Error('Failed to create product in Firestore');
  }
}

export async function updateProductService(productId: string, productData: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
  console.log(`Updating product with ID: ${productId} in Firestore:`, productData);
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      console.error("Error updating product in Firestore: Product not found.");
      return null;
    }

    // Use updateDoc for partial updates
    await updateDoc(productRef, productData as { [key: string]: any });

    // Fetch the updated document to return the complete Product object
    const updatedProductSnap = await getDoc(productRef);
    const updatedProductData = updatedProductSnap.data();
    const updatedProduct: Product = { id: updatedProductSnap.id, ...updatedProductData } as Product;
    console.log("Product updated in Firestore.");

    return updatedProduct;
  }
 catch (error) {
    console.error(`Error updating product with ID ${productId} in Firestore:`, error);
 throw new Error(`Failed to update product with ID ${productId} in Firestore`);
  }
}

export async function deleteProductService(productId: string): Promise<boolean> {
  console.log(`Deleting product with ID: ${productId} from Firestore.`);
  try {
    await deleteDoc(doc(db, 'products', productId));
    const success = true; // If deleteDoc doesn't throw, assume success
  if (success) {
    console.log("Product deleted from placeholder data.");
  } else {
    console.error("Error deleting product from placeholder data: Product not found or already deleted.");
  }
  return success;
}
 catch (error) {
    console.error(`Error deleting product with ID ${productId} from Firestore:`, error);
 return false; // Indicate failure
  }
}

export async function toggleProductActiveStatusService(productId: string, isActive: boolean): Promise<Product | null> {
  console.log(`Toggling active status for product ID: ${productId} to ${isActive} in Firestore.`);
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, { isActive: isActive });

    // Fetch the updated document to return the complete Product object
    const updatedProductSnap = await getDoc(productRef);
    const updatedProductData = updatedProductSnap.data();
    const updatedProduct: Product = { id: updatedProductSnap.id, ...updatedProductData } as Product;
    console.log("Product active status toggled in Firestore.");
    return updatedProduct;
  } catch (error) {
    console.error(`Error toggling product active status for ID ${productId} in Firestore:`, error);
 return null; // Return null on failure
  }
}
