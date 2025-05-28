
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
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const MINIMUM_ORDER_VALUE = 200;

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
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const isBelowMinimumOrder = totalPrice < MINIMUM_ORDER_VALUE;

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
    // Redirect if cart is empty and order not submitted OR if below minimum order value
    if (typeof window !== 'undefined' && !orderSubmitted) {
      if (cartItems.length === 0) {
        console.log('OrderForm: Cart is empty, redirecting to /cart');
        router.push('/cart');
      } else if (totalPrice < MINIMUM_ORDER_VALUE) {
        console.log(`OrderForm: Order total ${totalPrice} is below minimum ${MINIMUM_ORDER_VALUE}, redirecting to /cart`);
        toast({
          variant: 'destructive',
          title: 'סכום הזמנה נמוך מדי',
          description: `סכום ההזמנה המינימלי הוא ${formatPrice(MINIMUM_ORDER_VALUE)}. אנא חזור לעגלה והוסף פריטים.`,
        });
        router.push('/cart');
      }
    }
  }, [cartItems, totalPrice, router, orderSubmitted, toast]);


  const onSubmit = async (data: OrderFormValues) => {
    if (isBelowMinimumOrder) {
      toast({
        variant: 'destructive',
        title: 'לא ניתן לשלוח הזמנה',
        description: `סכום ההזמנה המינימלי הוא ${formatPrice(MINIMUM_ORDER_VALUE)}.`,
      });
      return;
    }
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
        description: `תודה רבה, ${data.customerName}. הזמנתך התקבלה. הסוכן ייצור עמך קשר בהקדם.`,
        duration: 5000,
      });
      
      clearCart();
      setOrderSubmitted(true); 
      console.log('Attempting to redirect to / from OrderForm');
      router.push('/'); 

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
    return `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (!orderSubmitted && (cartItems.length === 0 || isBelowMinimumOrder) && typeof window !== 'undefined') { 
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg text-muted-foreground">
          {cartItems.length === 0 ? "העגלה שלך ריקה. מעביר אותך לדף העגלה..." : `סכום ההזמנה נמוך מ-${formatPrice(MINIMUM_ORDER_VALUE)}. מעביר אותך לדף העגלה...`}
        </p>
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
              {isBelowMinimumOrder && !orderSubmitted && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">סכום ההזמנה המינימלי הוא {formatPrice(MINIMUM_ORDER_VALUE)}.</p>
                    <p>לא ניתן להמשיך עם סכום נמוך מזה.</p>
                  </div>
                </div>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting || cartItems.length === 0 || isBelowMinimumOrder}>
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
          {isBelowMinimumOrder && (
             <p className="text-xs text-destructive pt-1">
                נדרש סכום מינימום של {formatPrice(MINIMUM_ORDER_VALUE)} להזמנה.
            </p>
          )}
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
