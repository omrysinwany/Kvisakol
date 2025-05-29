'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '../shared/app-logo';
import { KeyRound, User, ArrowRight, Loader2 } from 'lucide-react';
import type { AdminUser } from '@/lib/types';
import Link from 'next/link';

// Import your database authentication service functions
import { getAdminUserByUsername, verifyAdminPassword } from '@/services/admin-user-service';


const loginFormSchema = z.object({
  username: z.string().min(3, { message: 'שם משתמש חייב להכיל לפחות 3 תווים.' }),
  password: z.string().min(6, { message: 'סיסמה חייבת להכיל לפחות 6 תווים.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function AdminLoginForm() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // This onSubmit will use your custom database authentication logic
  const onSubmit = async (data: LoginFormValues) => {
    console.log('Admin login attempt with username:', data.username);
    try {
      // Use your service to get the admin user by username
      const foundUser = await getAdminUserByUsername(data.username);

      if (foundUser) {
        // Use your service to verify the password against the hashed password from the database
        const isPasswordCorrect = await verifyAdminPassword(foundUser, data.password);

        if (isPasswordCorrect) {
          // Authentication successful
          console.log('Admin authenticated successfully:', foundUser.username);

          // Store admin user details (e.g., in local storage or a cookie)
          // IMPORTANT: Adapt this to your actual state management or session handling
          const loggedInUserDetails = {
            id: foundUser.id,
            username: foundUser.username,
            isSuperAdmin: foundUser.isSuperAdmin, // Assuming you have this field
            displayName: foundUser.displayName || foundUser.username,
          };
          localStorage.setItem('loggedInKviskalAdmin', JSON.stringify(loggedInUserDetails)); // Example using localStorage

          toast({
            title: "התחברות בוצעה בהצלחה",
            description: "ברוכים הבאים לממשק הניהול.",
            variant: "success",
          });
          // Redirect to admin dashboard
          router.push('/admin/dashboard');

        } else {
          // Password incorrect
          console.log('Admin login failed: Incorrect password');
          toast({
            title: 'שגיאת התחברות',
            description: 'שם משתמש או סיסמה שגויים. אנא נסה שנית.',
            variant: 'destructive',
          });
           // Optionally reset password field on failure for security
          form.resetField("password");
        }
      } else {
        // User not found
        console.log('Admin login failed: User not found');
         toast({
          title: 'שגיאת התחברות',
          description: 'שם משתמש או סיסמה שגויים. אנא נסה שנית.',
          variant: 'destructive',
        });
        // Optionally reset password field on failure for security
        form.resetField("password");
      }
    } catch (error) {
      console.error('Error during admin login:', error);
      toast({
        variant: 'destructive',
        title: 'שגיאה בתהליך ההתחברות',
        description: 'אירעה שגיאה לא צפויה. אנא נסה שוב מאוחר יותר או פנה לתמיכה.',
      });
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <AppLogo className="justify-center mb-2"/>
          <CardTitle className="text-2xl font-bold">כניסת מנהל מערכת</CardTitle>
          <CardDescription>הזן את שם המשתמש והסיסמה שלך כדי לגשת למערכת הניהול.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם משתמש</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="הזן שם משתמש" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סיסמה</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                 <>
                   <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                   מתחבר...
                 </>
                ) : (
                  <>
                    <KeyRound className="ml-2 h-5 w-5" />
                    התחבר
                  </>
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Button variant="link" asChild className="text-muted-foreground hover:text-primary">
              <Link href="/">
                <ArrowRight className="ml-1.5 h-4 w-4" />
                חזרה לקטלוג המוצרים
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}