'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { CartItemCard } from './cart-item';
import { ShoppingCart, AlertTriangle } from 'lucide-react';

const MINIMUM_ORDER_VALUE = 2000;

export function CartView() {
  const { cartItems, totalPrice, totalItems, clearCart } = useCart();
  const isBelowMinimumOrder = totalPrice < MINIMUM_ORDER_VALUE;

  const formatPrice = (price: number) => {
    return `₪${price.toLocaleString('he-IL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (totalItems === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">עגלת הקניות שלך ריקה</h2>
        <p className="text-muted-foreground mb-6">נראה שעדיין לא הוספת מוצרים לעגלה.</p>
        <Button asChild>
          <Link href="/">חזרה לקטלוג</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {cartItems.map((item) => (
          <CartItemCard key={item.id} item={item} />
        ))}
      </div>

      <Card className="lg:col-span-1 h-fit sticky top-20 shadow-xl">
        <CardContent className="space-y-3 pt-6">
          <div className="flex justify-between items-center font-semibold text-lg">
            <span className="text-muted-foreground">סה"כ לתשלום:</span>
            <span className="text-primary text-xl">{formatPrice(totalPrice)}</span>
          </div>

          {isBelowMinimumOrder && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm flex items-center gap-2 mt-2">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-semibold">
                  סכום ההזמנה המינימלי הוא {formatPrice(MINIMUM_ORDER_VALUE)}.
                </p>
                <p>אנא הוסף פריטים נוספים לעגלה.</p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground pt-2">
            המחירים לצורך מידע בלבד. התשלום יתבצע ישירות מול הסוכן.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            asChild
            size="lg"
            className="w-full"
            disabled={isBelowMinimumOrder}
          >
            <Link
              href="/checkout"
              aria-disabled={isBelowMinimumOrder}
              tabIndex={isBelowMinimumOrder ? -1 : undefined}
              style={{
                pointerEvents: isBelowMinimumOrder ? 'none' : 'auto',
              }}
            >
              המשך להזמנה
            </Link>
          </Button>

          <Button variant="outline" onClick={clearCart} className="w-full">
            רוקן עגלה
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
