'use client';
import { AppLogo } from '@/components/shared/app-logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, UserCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import { AdminSidebarNav } from './admin-sidebar-nav'; // We'll create this next

export function AdminHeader() {
  // Placeholder for actual logout logic
  const handleLogout = () => {
    console.log('Logout triggered');
    // router.push('/admin/login'); // Example redirect
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
             <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">פתח תפריט ניווט</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-0">
                  <div className="p-4 border-b">
                    <AppLogo />
                  </div>
                  <AdminSidebarNav isMobile={true} />
                </SheetContent>
              </Sheet>
          </div>
          <div className="hidden lg:block">
             <AppLogo />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">סוכן מנהל</span>
          <UserCircle className="h-7 w-7 text-muted-foreground" />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="ml-2 h-4 w-4" />
            התנתק
          </Button>
        </div>
      </div>
    </header>
  );
}
