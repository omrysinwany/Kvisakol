
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
import { KeyRound, User } from 'lucide-react';
import { placeholderAdminUsers } from '@/lib/placeholder-data'; // Import admin users
import type { AdminUser } from '@/lib/types';

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

  const onSubmit = async (data: LoginFormValues) => {
    console.log('Admin login attempt:', data);
    
    const foundUser = placeholderAdminUsers.find(
      (user) => user.username === data.username && user.passwordHash === data.password // In real app, compare hashed password
    );

    if (foundUser) {
      // Store user info in localStorage
      // Note: Storing sensitive info like full user object in localStorage is not recommended for production.
      // For this demo, we store a simplified version.
      const loggedInUserDetails = {
        id: foundUser.id,
        username: foundUser.username,
        isSuperAdmin: foundUser.isSuperAdmin,
        displayName: foundUser.displayName || foundUser.username,
      };
      localStorage.setItem('loggedInKviskalAdmin', JSON.stringify(loggedInUserDetails));

      toast({
        title: 'התחברות מוצלחת',
        description: `ברוך הבא, ${foundUser.displayName || foundUser.username}!`,
      });
      router.push('/admin/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'שגיאת התחברות',
        description: 'שם משתמש או סיסמה שגויים. אנא נסה שנית.',
      });
      form.resetField("password");
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
                        <Input placeholder="לדוגמה: superadmin" {...field} className="pl-10" />
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
                {form.formState.isSubmitting ? 'מתחבר...' : (
                  <>
                    <KeyRound className="ml-2 h-5 w-5" />
                    התחבר
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
