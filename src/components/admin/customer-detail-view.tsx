
'use client';

import type { CustomerSummary, Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { OrderTable } from '@/components/admin/order-table';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Phone, MapPin, CalendarDays, ShoppingBag, Hash, UserCircle } from 'lucide-react';

interface CustomerDetailViewProps {
  customer: CustomerSummary;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
}

export function CustomerDetailView({ customer, orders, onUpdateOrderStatus }: CustomerDetailViewProps) {
  const formatPrice = (price: number) => `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">{customer.name}</CardTitle>
          </div>
          <CardDescription className="flex items-center gap-1.5 text-sm">
             <Phone className="w-3.5 h-3.5 text-muted-foreground"/> 
             <a href={`tel:${customer.phone}`} className="text-primary hover:underline">{customer.phone}</a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-6 border-t border-b py-4">
            <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">כתובת אחרונה</div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p>{customer.latestAddress || 'לא זמינה'}</p>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">הזמנה אחרונה</div>
               <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <p>{format(new Date(customer.lastOrderDate), 'dd/MM/yyyy', { locale: he })}</p>
              </div>
            </div>
             <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">סה"כ הזמנות</div>
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <p>{customer.totalOrders}</p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-2 flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-primary"/>
            היסטוריית הזמנות של {customer.name} ({orders.length})
          </h3>
          {orders.length > 0 ? (
            <OrderTable orders={orders} onUpdateStatus={onUpdateOrderStatus} />
          ) : (
            <p className="text-muted-foreground text-center py-4">לא נמצאו הזמנות עבור לקוח זה.</p>
          )}
        </CardContent>
         <CardFooter className="flex justify-end items-center bg-muted/30 p-3 rounded-b-md">
            <div className="text-sm">
              <span>סך כל ההוצאות של הלקוח: </span>
              <span className="font-semibold text-primary">{formatPrice(customer.totalSpent)}</span>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
