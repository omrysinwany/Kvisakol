
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Placeholder for logged in user type, ideally from a shared types file or context
interface LoggedInAdmin {
  username: string;
  isSuperAdmin: boolean;
}

export default function AdminAgentsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInKviskalAdmin');
      if (storedUser) {
        try {
          const user: LoggedInAdmin = JSON.parse(storedUser);
          if (user.isSuperAdmin) {
            setIsAuthorized(true);
          } else {
            router.replace('/admin/dashboard'); // Redirect if not super admin
          }
        } catch (e) {
          console.error("Error parsing user from localStorage", e);
          router.replace('/admin/login'); // Redirect if error or no user
        }
      } else {
        router.replace('/admin/login'); // Redirect if no user in localStorage
      }
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>טוען...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    // This case should ideally be handled by the redirect in useEffect,
    // but as a fallback:
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>אין הרשאה</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">אין לך הרשאה לגשת לדף זה.</p>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/admin/dashboard">
                        <ArrowRight className="ml-2 h-4 w-4"/>
                        חזור ללוח הבקרה
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  // If authorized, render the page content
  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול סוכנים</h1>
        {/* Button to add new agent will be added later */}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>רשימת סוכנים</CardTitle>
          <CardDescription>
            כאן תוכל לנהל את כל הסוכנים הרשומים במערכת. (פונקציונליות הוספה ועריכה תתווסף בהמשך)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            בקרוב תוכל לראות כאן רשימה של סוכנים ולהוסיף סוכנים חדשים.
          </p>
          {/* Placeholder for agent list and add agent form */}
        </CardContent>
      </Card>
    </>
  );
}
