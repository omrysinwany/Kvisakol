
'use client';
import { AppLogo } from '@/components/shared/app-logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'; // Added SheetTitle
import { Menu, UserCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import { AdminSidebarNav } from './admin-sidebar-nav';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useEffect, useState } from 'react';

interface LoggedInAdmin {
  username: string;
  displayName?: string;
  isSuperAdmin: boolean;
}

export function AdminHeader() {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<LoggedInAdmin | null>(null);
  const [openMobile, setOpenMobile] = useState(false); // State for mobile sheet

  useEffect(() => {
    // Ensure this runs only on client side
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInKviskalAdmin');
      if (storedUser) {
        try {
          setLoggedInUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse loggedInKviskalAdmin from localStorage", error);
          localStorage.removeItem('loggedInKviskalAdmin'); // Clear corrupted data
        }
      }
    }
  }, []);


  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('loggedInKviskalAdmin');
    }
    console.log('Logout triggered, redirecting to homepage');
    router.push('/'); 
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
             <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setOpenMobile(true)}>
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">פתח תפריט ניווט</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-0">
                  <SheetTitle className="sr-only">תפריט ניווט נייד</SheetTitle>
                  <div className="p-4 border-b">
                    <AppLogo />
                  </div>
                  <AdminSidebarNav isMobile={true} onMobileLinkClick={() => setOpenMobile(false)} />
                </SheetContent>
              </Sheet>
          </div>
          <div className="hidden lg:block">
             <AppLogo />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {loggedInUser ? (loggedInUser.displayName || loggedInUser.username) : 'סוכן מנהל'}
          </span>
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
