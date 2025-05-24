
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderTable } from '@/components/admin/order-table';
import { getOrdersForAdmin, updateOrderStatusService } from '@/services/order-service';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type StatusFilterValue = Order['status'] | 'all';

const statusTranslationsForFilter: Record<StatusFilterValue, string> = {
  all: 'כל הסטטוסים',
  new: 'חדשה',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
};


export default function AdminOrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const fetchedOrders = await getOrdersForAdmin();
        setAllOrders(fetchedOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לטעון את רשימת ההזמנות." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [toast]);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updatedOrder = await updateOrderStatusService(orderId, newStatus);
      if (updatedOrder) {
        setAllOrders(prevOrders =>
          prevOrders.map(o => (o.id === orderId ? { ...updatedOrder } : o)) // Use updatedOrder from service
        );
        toast({
          title: "סטטוס הזמנה עודכן",
          description: `הסטטוס של הזמנה ${orderId.substring(orderId.length - 6)} שונה ל: ${statusTranslationsForFilter[newStatus]}.`,
        });
      } else {
        toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לעדכן את סטטוס ההזמנה." });
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({ variant: "destructive", title: "שגיאה", description: "אירעה תקלה בעדכון סטטוס ההזמנה." });
    }
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') {
      return allOrders;
    }
    return allOrders.filter(order => order.status === statusFilter);
  }, [allOrders, statusFilter]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען הזמנות...</p></div>;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 space-y-2 sm:space-y-0 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול הזמנות</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilterValue)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="סנן לפי סטטוס" />
            </SelectTrigger>
            <SelectContent>
              {(['all', 'new', 'completed', 'cancelled'] as StatusFilterValue[]).map((statusKey) => (
                <SelectItem key={statusKey} value={statusKey}>
                  {statusTranslationsForFilter[statusKey]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto">
              <Download className="ml-2 h-4 w-4" />
              ייצא הזמנות (CSV)
          </Button>
        </div>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>רשימת הזמנות ({filteredOrders.length})</CardTitle>
          <CardDescription>
            נהל את כל ההזמנות שהתקבלו מלקוחות. עקוב אחר סטטוסים ופרטי הזמנות.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length > 0 ? (
            <OrderTable orders={filteredOrders} onUpdateStatus={handleUpdateStatus} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {allOrders.length === 0 ? 'לא קיימות הזמנות במערכת.' : 'לא נמצאו הזמנות התואמות את הסינון הנוכחי.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
