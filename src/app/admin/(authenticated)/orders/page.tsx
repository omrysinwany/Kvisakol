
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderTable } from '@/components/admin/order-table';
import { getOrdersForAdmin, updateOrderStatusService } from '@/services/order-service';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const fetchedOrders = await getOrdersForAdmin();
        setOrders(fetchedOrders);
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
        setOrders(prevOrders =>
          prevOrders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        toast({
          title: "סטטוס הזמנה עודכן",
          description: `הסטטוס של הזמנה ${orderId.substring(orderId.length - 6)} שונה ל: ${newStatus}.`,
        });
      } else {
        toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לעדכן את סטטוס ההזמנה." });
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({ variant: "destructive", title: "שגיאה", description: "אירעה תקלה בעדכון סטטוס ההזמנה." });
    }
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען הזמנות...</p></div>;
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול הזמנות</h1>
        <Button variant="outline">
            <Download className="ml-2 h-4 w-4" />
            ייצא הזמנות (CSV)
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>רשימת הזמנות</CardTitle>
          <CardDescription>
            נהל את כל ההזמנות שהתקבלו מלקוחות. עקוב אחר סטטוסים ופרטי הזמנות.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <OrderTable orders={orders} onUpdateStatus={handleUpdateStatus} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">לא נמצאו הזמנות.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
