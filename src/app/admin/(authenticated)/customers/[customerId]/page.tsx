
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getOrdersByCustomerPhone, getCustomerSummaryById } from '@/services/order-service';
import type { CustomerSummary, Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { CustomerDetailView } from '@/components/admin/customer-detail-view';
import { updateOrderStatusService } from '@/services/order-service'; // Added for potential use

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
            setCustomer(null); // Explicitly set to null if not found
            setOrders([]); // Clear orders if customer not found
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
    // This function might be needed if you want to update order status from this page
    // For now, it's similar to the one in [orderId]/page.tsx
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
        toast({
          title: "סטטוס הזמנה עודכן",
          description: `הסטטוס של הזמנה ${orderId.substring(orderId.length - 6)} שונה ל: ${statusTranslationsToast[newStatus]}.`,
        });
        // Refresh customer summary if an order impacting totalSpent is completed/cancelled
        if (newStatus === 'completed' || newStatus === 'cancelled') {
            if (customer) { // Check if customer exists before trying to refresh
                const updatedCustomerSummary = await getCustomerSummaryById(customer.id);
                if (updatedCustomerSummary) {
                    setCustomer(updatedCustomerSummary);
                }
            }
        }

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

  if (!customer) { // If customer summary wasn't found
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
  
  // This log is important: it shows if orders were found even if customer summary was.
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
      <CustomerDetailView customer={customer} orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />
    </>
  );
}
