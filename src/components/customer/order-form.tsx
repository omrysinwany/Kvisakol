
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useCart } from '@/contexts/cart-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createOrderService } from '@/services/order-service';
import type { OrderItem } from '@/lib/types';
import { useEffect } from 'react'; // Import useEffect

const orderFormSchema = z.object({
  customerName: z.string().min(2, { message: 'שם חייב להכיל לפחות 2 תווים.' }),
  customerPhone: z.string().regex(/^0\d([\d]{0,1})([-]{0,1})\d{7}$/, { message: 'מספר טלפון לא תקין.' }),
  customerAddress: z.string().min(5, { message: 'כתובת חייבת להכיל לפחות 5 תווים.' }),
  customerNotes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export function OrderForm() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      customerNotes: '',
    },
  });

  useEffect(() => {
    // Redirect to cart if cart is empty, runs only on client after mount
    if (typeof window !== 'undefined' && cartItems.length === 0) {
      router.push('/cart');
    }
  }, [cartItems, router]);


  const onSubmit = async (data: OrderFormValues) => {
    try {
      const orderItems: OrderItem[] = cartItems.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        priceAtOrder: item.price,
      }));

      const createdOrder = await createOrderService({
        ...data,
        items: orderItems,
        totalAmount: totalPrice,
      });

      toast({
        title: "הזמנה נשלחה בהצלחה!",
        description: `תודה רבה, ${data.customerName}. הזמנתך התקבלה ומספרה ${createdOrder.id}. הסוכן ייצור עמך קשר בהקדם.`,
        duration: 5000,
      });
      
      clearCart();
      router.push(`/order-confirmation/${createdOrder.id}`);

    } catch (error) {
      console.error('Failed to submit order:', error);
      toast({
        variant: 'destructive',
        title: 'שגיאה בשליחת ההזמנה',
        description: 'אירעה שגיאה לא צפויה. אנא נסה שוב מאוחר יותר או פנה לתמיכה.',
      });
    }
  };
  
  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`;
  }

  // Return null or a loading state while redirecting or if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg text-muted-foreground">העגלה שלך ריקה, מעביר אותך לדף העגלה...</p>
      </div>
    ); 
  }


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>פרטי משלוח והזמנה</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם מלא</FormLabel>
                    <FormControl>
                      <Input placeholder="לדוגמה: ישראל ישראלי" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מספר טלפון</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="לדוגמה: 050-1234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>כתובת למשלוח</FormLabel>
                    <FormControl>
                      <Input placeholder="עיר, רחוב, מספר בית, דירה" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>הערות נוספות (אופציונלי)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="לדוגמה: נא להשאיר ליד הדלת, שעות נוחות ליצירת קשר וכו'." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting || cartItems.length === 0}>
                {form.formState.isSubmitting ? 'שולח הזמנה...' : 'שלח הזמנה לסוכן'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="md:col-span-1 h-fit sticky top-20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">סיכום ההזמנה שלך</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cartItems.map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm border-b pb-1 last:border-b-0 last:pb-0">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">כמות: {item.quantity}</p>
              </div>
              <p>{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-lg pt-2">
            <span>סכום כולל:</span>
            <span className="text-primary">{formatPrice(totalPrice)}</span>
          </div>
        </CardContent>
         <CardFooter>
           <p className="text-xs text-muted-foreground">
            התשלום יתבצע ישירות מול הסוכן.
          </p>
         </CardFooter>
      </Card>
    </div>
  );
}
