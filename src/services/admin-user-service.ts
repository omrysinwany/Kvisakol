
'use server';

import { db } from '@/lib/firebase/config';
import type { AdminUser } from '@/lib/types';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// Helper function to convert Firestore doc data to AdminUser
const adminUserFromDoc = (docSnap: any): AdminUser => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    username: data.username || '',
    passwordHash: data.passwordHash || '', // In a real app, this would be a proper hash from a secure auth system
    isSuperAdmin: data.isSuperAdmin !== undefined ? data.isSuperAdmin : false,
    displayName: data.displayName || data.username || '',
  };
};

export async function getAdminUserByUsername(username: string): Promise<AdminUser | null> {
  console.log(`Fetching admin user by username: ${username} from Firestore.`);
  // !! SECURITY WARNING !!
  // This is a simplified lookup. In a real app, ensure proper indexing for usernames if this is a common query.
  // More importantly, password verification should be handled by a secure authentication system like Firebase Authentication.
  try {
    const usersCollection = collection(db, 'adminUsers');
    const q = query(usersCollection, where('username', '==', username), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      console.log(`Admin user ${username} found in Firestore.`);
      return adminUserFromDoc(userDoc);
    } else {
      console.log(`No admin user found with username: ${username} in Firestore.`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching admin user by username from Firestore:", error);
    return null;
  }
}

export async function verifyAdminPassword(user: AdminUser, passwordAttempt: string): Promise<boolean> {
  console.log(`Verifying password for admin user: ${user.username}.`);
  // !! EXTREME SECURITY WARNING !!
  // This method compares a plaintext password attempt with a stored (potentially plaintext) "passwordHash".
  // THIS IS HIGHLY INSECURE AND MUST NOT BE USED IN A PRODUCTION ENVIRONMENT.
  // Use Firebase Authentication or a similar secure service for user authentication,
  // which handles password hashing and secure comparison.
  // For this demo, it replicates the placeholder behavior.
  const isMatch = user.passwordHash === passwordAttempt;
  console.log(`Password verification for ${user.username} ${isMatch ? 'succeeded' : 'failed'}.`);
  return Promise.resolve(isMatch);
}
