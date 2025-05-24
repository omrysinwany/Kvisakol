
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, ShoppingBasket, UsersGroup, Settings } from 'lucide-react'; // Added UsersGroup
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isSuperAdminOnly?: boolean;
}

const baseNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { href: '/admin/products', label: 'ניהול מוצרים', icon: Package },
  { href: '/admin/orders', label: 'ניהול הזמנות', icon: ShoppingBasket },
  { href: '/admin/agents', label: 'ניהול סוכנים', icon: UsersGroup, isSuperAdminOnly: true },
  // { href: '/admin/settings', label: 'הגדרות', icon: Settings }, // Example for future extension
];

export function AdminSidebarNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure this runs only on client side
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInKviskalAdmin');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setIsSuperAdmin(user?.isSuperAdmin === true);
        } catch (error) {
          console.error("Failed to parse user from localStorage for sidebar", error);
        }
      }
      setIsLoading(false);
    }
  }, []);

  if (isLoading && typeof window !== 'undefined') {
    // Optional: Show a loading state or skeleton for nav items
    return (
      <nav className={cn("flex flex-col gap-1 p-4", isMobile ? "" : "lg:gap-2 lg:p-4")}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 bg-muted rounded-md animate-pulse"></div>
        ))}
      </nav>
    );
  }
  
  const navItems = baseNavItems.filter(item => !item.isSuperAdminOnly || (item.isSuperAdminOnly && isSuperAdmin));

  return (
    <nav className={cn("flex flex-col gap-1 p-4", isMobile ? "" : "lg:gap-2 lg:p-4")}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent',
            pathname === item.href && 'bg-accent text-primary font-semibold',
            isMobile ? 'text-base' : 'text-sm'
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
