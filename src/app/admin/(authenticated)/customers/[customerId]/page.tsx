
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCustomerSummaryByPhone, getOrdersByCustomerPhone, updateOrderStatusService } from '@/services/order-service';
import type { CustomerSummary, Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { CustomerDetailView } from '@/components/admin/customer-detail-view';

const statusTranslationsForToast: Record<Order['status'], string> = {
  new: 'חדשה',
  received: 'התקבלה',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
};

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = params.customerId as string; // This is the customer's phone number

  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      const fetchCustomerData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const [customerSummary, customerOrders] = await Promise.all([
            getCustomerSummaryByPhone(customerId),
            getOrdersByCustomerPhone(customerId),
          ]);

          if (customerSummary) {
            setCustomer(customerSummary);
            setOrders(customerOrders);
          } else {
            setError('לקוח לא נמצא.');
            toast({ variant: 'destructive', title: 'שגיאה', description: 'הלקוח המבוקש לא נמצא.' });
          }
        } catch (err) {
          console.error("Failed to fetch customer data:", err);
          setError('שגיאה בטעינת נתוני הלקוח.');
          toast({ variant: 'destructive', title: 'שגיאה', description: 'אירעה שגיאה בטעינת נתוני הלקוח.' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchCustomerData();
    }
  }, [customerId, toast]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updatedOrder = await updateOrderStatusService(orderId, newStatus);
      if (updatedOrder) {
        setOrders(prevOrders =>
          prevOrders.map(o => (o.id === orderId ? { ...updatedOrder } : o))
        );
        toast({
          title: "סטטוס הזמנה עודכן",
          description: `הסטטוס של הזמנה ${orderId.substring(orderId.length - 6)} שונה ל: ${statusTranslationsForToast[newStatus]}.`,
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
    return <div className="container mx-auto px-4 py-8"><p>טוען פרטי לקוח והזמנות...</p></div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-destructive text-center text-lg">{error}</p>
        <div className="text-center mt-4">
          <Button asChild variant="outline">
            <Link href="/admin/customers">
              <ArrowRight className="ml-2 h-4 w-4" />
              חזור לרשימת הלקוחות
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return <div className="container mx-auto px-4 py-8"><p>לא ניתן לטעון את פרטי הלקוח.</p></div>;
  }

  return (
    <>
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/customers">
            <ArrowRight className="ml-2 h-4 w-4" />
            חזרה לרשימת הלקוחות
          </Link>
        </Button>
      </div>
      <CustomerDetailView customer={customer} orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />
    </>
  );
}
