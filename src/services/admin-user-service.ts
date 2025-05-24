
'use server';

import { placeholderAdminUsers } from '@/lib/placeholder-data';
import type { AdminUser } from '@/lib/types';

// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getAdminUserByUsername(username: string): Promise<AdminUser | null> {
  // await delay(50);
  const user = placeholderAdminUsers.find(u => u.username === username) || null;
  return Promise.resolve(user);
}

// In a real app, password would be checked by the backend after hashing
export async function verifyAdminPassword(user: AdminUser, passwordAttempt: string): Promise<boolean> {
  // For placeholder, direct comparison. NEVER do this in production.
  return Promise.resolve(user.passwordHash === passwordAttempt);
}
