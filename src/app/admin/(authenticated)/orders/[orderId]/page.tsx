
'use client'; 

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OrderDetailView } from '@/components/admin/order-detail-view';
import { getOrderByIdForAdmin, updateOrderStatusService } from '@/services/order-service';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        setIsLoading(true);
        try {
          const fetchedOrder = await getOrderByIdForAdmin(orderId);
          if (fetchedOrder) {
            setOrder(fetchedOrder);
          } else {
            setError('הזמנה לא נמצאה.');
            toast({ variant: 'destructive', title: 'שגיאה', description: 'ההזמנה המבוקשת לא נמצאה.' });
            // router.push('/admin/orders'); // Optional: redirect if not found
          }
        } catch (err) {
          console.error("Failed to fetch order:", err);
          setError('שגיאה בטעינת ההזמנה.');
          toast({ variant: 'destructive', title: 'שגיאה', description: 'אירעה שגיאה בטעינת ההזמנה.' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderId, router, toast]);

  const handleUpdateStatus = async (updatedOrderId: string, newStatus: Order['status']) => {
    try {
      const updatedOrder = await updateOrderStatusService(updatedOrderId, newStatus);
      if (updatedOrder) {
        if (order && order.id === updatedOrderId) {
          setOrder({ ...order, status: newStatus });
        }
        toast({
          title: "סטטוס הזמנה עודכן",
          description: `הסטטוס של הזמנה ${updatedOrderId.substring(updatedOrderId.length -6)} שונה ל: ${newStatus}.`,
        });
      } else {
        toast({ variant: 'destructive', title: 'שגיאה', description: 'לא ניתן היה לעדכן את סטטוס ההזמנה.' });
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({ variant: 'destructive', title: 'שגיאה', description: 'אירעה תקלה בעדכון סטטוס ההזמנה.' });
    }
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען פרטי הזמנה...</p></div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-destructive text-center text-lg">{error}</p>
        <div className="text-center mt-4">
            <Button asChild variant="outline">
                <Link href="/admin/orders">
                    <ArrowRight className="ml-2 h-4 w-4"/>
                    חזור לרשימת ההזמנות
                </Link>
            </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="container mx-auto px-4 py-8"><p>לא ניתן לטעון את ההזמנה.</p></div>;
  }

  return (
    <>
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
            <Link href="/admin/orders">
                <ArrowRight className="ml-2 h-4 w-4"/>
                חזרה לכל ההזמנות
            </Link>
        </Button>
      </div>
      <OrderDetailView order={order} onUpdateStatus={handleUpdateStatus} />
    </>
  );
}
