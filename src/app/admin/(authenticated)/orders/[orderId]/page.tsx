
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OrderDetailView } from '@/components/admin/order-detail-view';
import { getOrderByIdForAdmin, updateOrderStatusService, markOrderAsViewedService, updateOrderAgentNotes } from '@/services/order-service';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const statusTranslationsToast: Record<Order['status'], string> = {
  new: 'חדשה',
  received: 'התקבלה',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
};

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
            if (!fetchedOrder.isViewedByAgent && fetchedOrder.status === 'new') {
              try {
                const markedOrder = await markOrderAsViewedService(fetchedOrder.id);
                if (markedOrder) {
                   setOrder(markedOrder);
                   toast({
                     title: "הזמנה התקבלה",
                     description: `סטטוס הזמנה ${orderId.substring(orderId.length -6)} שונה ל: "התקבלה".`,
                   });
                } else {
                    setOrder(fetchedOrder); // Fallback to fetchedOrder if marking failed
                }
              } catch (viewError) {
                console.error("Failed to mark order as viewed/received:", viewError);
                setOrder(fetchedOrder); // Fallback
              }
            } else {
                setOrder(fetchedOrder);
            }
          } else {
            setError('הזמנה לא נמצאה.');
            toast({ variant: 'destructive', title: 'שגיאה', description: 'ההזמנה המבוקשת לא נמצאה.' });
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
          setOrder(updatedOrder);
        }
        toast({
          title: "סטטוס הזמנה עודכן",
          description: `הסטטוס של הזמנה ${updatedOrderId.substring(updatedOrderId.length -6)} שונה ל: ${statusTranslationsToast[newStatus]}.`,
        });
      } else {
        toast({ variant: 'destructive', title: 'שגיאה', description: 'לא ניתן היה לעדכן את סטטוס ההזמנה.' });
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({ variant: 'destructive', title: 'שגיאה', description: 'אירעה תקלה בעדכון סטטוס ההזמנה.' });
    }
  };

  const handleSaveAgentNotes = async (notesOrderId: string, notes: string) => {
    try {
      const updatedOrderWithNotes = await updateOrderAgentNotes(notesOrderId, notes);
      if (updatedOrderWithNotes) {
        if (order && order.id === notesOrderId) {
          setOrder(prevOrder => prevOrder ? { ...prevOrder, agentNotes: updatedOrderWithNotes.agentNotes } : null);
        }
        toast({ title: "הערות סוכן נשמרו", description: "ההערות הפנימיות להזמנה נשמרו בהצלחה." });
      } else {
        toast({ variant: 'destructive', title: 'שגיאה', description: 'לא ניתן היה לשמור את הערות הסוכן.' });
      }
    } catch (err) {
      console.error("Failed to save agent notes:", err);
      toast({ variant: 'destructive', title: 'שגיאה', description: 'אירעה תקלה בשמירת הערות הסוכן.' });
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
      <OrderDetailView order={order} onUpdateStatus={handleUpdateStatus} onSaveAgentNotes={handleSaveAgentNotes} />
    </>
  );
}
