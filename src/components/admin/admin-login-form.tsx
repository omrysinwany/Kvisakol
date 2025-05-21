'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation'; // Changed from 'next/navigation'
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '../shared/app-logo';
import { KeyRound } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'כתובת אימייל לא תקינה.' }),
  password: z.string().min(6, { message: 'סיסמה חייבת להכיל לפחות 6 תווים.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function AdminLoginForm() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    // Placeholder for Firebase Authentication
    console.log('Admin login attempt:', data);
    // Simulate login
    if (data.email === 'agent@kviskal.com' && data.password === 'password') {
      toast({
        title: 'התחברות מוצלחת',
        description: 'ברוך הבא, סוכן יקר!',
      });
      router.push('/admin/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'שגיאת התחברות',
        description: 'אימייל או סיסמה שגויים. אנא נסה שנית.',
      });
      form.resetField("password");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <AppLogo className="justify-center mb-2"/>
          <CardTitle className="text-2xl font-bold">כניסת סוכן מכירות</CardTitle>
          <CardDescription>הזן את פרטיך כדי לגשת למערכת הניהול.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>כתובת אימייל</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="agent@kviskal.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
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
