'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, ShoppingBasket, Settings, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { href: '/admin/products', label: 'ניהול מוצרים', icon: Package },
  { href: '/admin/orders', label: 'ניהול הזמנות', icon: ShoppingBasket },
  // { href: '/admin/customers', label: 'לקוחות', icon: Users }, // Example for future extension
  // { href: '/admin/settings', label: 'הגדרות', icon: Settings }, // Example for future extension
];

export function AdminSidebarNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

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
