"use client";

import Link from 'next/link';
import { ShoppingCart, User } from 'lucide-react';
import { AppLogo } from '@/components/shared/app-logo';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';
import { Badge } from '@/components/ui/badge';

export function CustomerHeader() {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <AppLogo />
        <nav className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
                >
                  {totalItems}
                </Badge>
              )}
              <span className="sr-only">עגלת קניות</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/login">
              <User className="mr-2 h-4 w-4" />
              כניסת סוכן
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
