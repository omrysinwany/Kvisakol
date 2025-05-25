
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getOrdersByCustomerPhone, getCustomerSummaryById, updateOrderStatusService } from '@/services/order-service';
import type { CustomerSummary, Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { CustomerDetailView } from '@/components/admin/customer-detail-view';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AdminCustomerDetailPage: useEffect triggered. Customer ID from params:', customerId);
    if (customerId) {
      const fetchCustomerData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          console.log(`AdminCustomerDetailPage: Attempting to fetch summary for customer ID: ${customerId}`);
          const customerSummaryData = await getCustomerSummaryById(customerId);
          console.log('AdminCustomerDetailPage: Fetched customer summary:', customerSummaryData);

          if (customerSummaryData) {
            setCustomer(customerSummaryData);
            console.log(`AdminCustomerDetailPage: Attempting to fetch orders for customer phone: ${customerSummaryData.phone}`);
            const customerOrders = await getOrdersByCustomerPhone(customerSummaryData.phone);
            console.log(`AdminCustomerDetailPage: Fetched ${customerOrders.length} orders for customer phone ${customerSummaryData.phone}:`, customerOrders.map(o => o.id));
            setOrders(customerOrders.sort((a, b) => new Date(b.orderTimestamp).getTime() - new Date(a.orderTimestamp).getTime()));
          } else {
            setError('הלקוח המבוקש לא נמצא במערכת הלקוחות.');
            console.warn(`AdminCustomerDetailPage: No customer document found for ID ${customerId} in 'customers' collection.`);
            setCustomer(null);
            setOrders([]);
          }
        } catch (err) {
          console.error("AdminCustomerDetailPage: Failed to fetch customer data:", err);
          setError('שגיאה בטעינת נתוני הלקוח.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCustomerData();
    } else {
        console.warn('AdminCustomerDetailPage: customerId is missing or invalid from params.');
        setIsLoading(false);
        setError('שגיאה: מזהה לקוח חסר או לא תקין.');
    }
  }, [customerId]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    const statusTranslationsToast: Record<Order['status'], string> = {
      new: 'חדשה',
      received: 'התקבלה',
      completed: 'הושלמה',
      cancelled: 'בוטלה',
    };
    try {
      const updatedOrder = await updateOrderStatusService(orderId, newStatus);
      if (updatedOrder) {
        setOrders(prevOrders =>
          prevOrders.map(o => (o.id === orderId ? { ...updatedOrder } : o))
        );
        // Also update customer summary if the order status change affects it (e.g. totalSpent on 'completed')
        // For now, we rely on the summary in `customers` collection. A more robust solution might re-fetch or re-calculate.
        toast({
          title: "סטטוס הזמנה עודכן",
          description: `הסטטוס של הזמנה ${orderId.substring(orderId.length - 6)} שונה ל: ${statusTranslationsToast[newStatus]}.`,
        });
      } else {
        toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לעדכן את סטטוס ההזמנה." });
      }
    } catch (error) {
      console.error("AdminCustomerDetailPage: Failed to update order status:", error);
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
    // This case covers when getCustomerSummaryById returns null.
    // It implies the customerId (phone) from URL wasn't found in 'customers' collection.
    return (
        <div className="container mx-auto px-4 py-8">
            <p className="text-center text-lg">לא נמצא לקוח עם המזהה (טלפון) שהתקבל: {customerId}.</p>
            <p className="text-center text-sm text-muted-foreground">
                ייתכן שהלקוח עדיין לא ביצע הזמנות או שהמזהה אינו תקין.
            </p>
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
  
  // If customer summary is found, but orders might be empty
  if (customer && orders.length === 0) {
    console.log(`AdminCustomerDetailPage: Customer ${customer.name} found, but they have 0 orders fetched from 'orders' collection.`);
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
      {/* CustomerDetailView will show customer.totalOrders which might be stale if orders were manually deleted. 
          The order list itself will show orders.length which is the live count. */}
      <CustomerDetailView customer={customer} orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />
    </>
  );
}
