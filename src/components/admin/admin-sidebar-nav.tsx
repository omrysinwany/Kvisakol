
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, ShoppingBasket, Users, Settings, LayoutList } from 'lucide-react'; // Changed UsersGroup to Users, Added LayoutList
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
  { href: '/', label: 'קטלוג', icon: LayoutList },
  { href: '/admin/products', label: 'ניהול מוצרים', icon: Package },
  { href: '/admin/orders', label: 'ניהול הזמנות', icon: ShoppingBasket },
  // { href: '/admin/settings', label: 'הגדרות', icon: Settings }, // Example for future extension
];

export function AdminSidebarNav({ 
  isMobile = false, 
  onMobileLinkClick 
}: { 
  isMobile?: boolean;
  onMobileLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // isLoading is true initially

  useEffect(() => {
    // This effect runs on the client after hydration
    const storedUser = localStorage.getItem('loggedInKviskalAdmin');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setIsSuperAdmin(user?.isSuperAdmin === true);
      } catch (error) {
        console.error("Failed to parse user from localStorage for sidebar", error);
      }
    }
    setIsLoading(false); // Set isLoading to false after checking localStorage
  }, []);

  // If still loading (e.g. initial render before useEffect runs), show skeleton.
  // This will render on both server and client initially if isLoading is true.
  if (isLoading) {
    return (
      <nav className={cn("flex flex-col gap-1 p-4", isMobile ? "" : "lg:gap-2 lg:p-4")}>
        {[...Array(4)].map((_, i) => ( // Increased skeleton items due to new link
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
          onClick={isMobile ? onMobileLinkClick : undefined}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent',
            // Special handling for root path to avoid highlighting it for all admin sub-paths
            (pathname === item.href && item.href !== '/') || (pathname === '/' && item.href === '/') ? 'bg-accent text-primary font-semibold' : '',
            // If current path is an admin path and item.href is '/', don't highlight it unless explicitly on '/'
            (pathname.startsWith('/admin') && item.href === '/') ? '' : (pathname === item.href ? 'bg-accent text-primary font-semibold' : ''),
            isMobile ? 'text-base' : 'text-sm'
          )}
          target={item.href === '/' ? '_blank' : undefined} 
          rel={item.href === '/' ? 'noopener noreferrer' : undefined}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
