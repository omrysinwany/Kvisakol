
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getOrdersByCustomerPhone, getCustomerSummaryById } from '@/services/order-service'; // Re-added getCustomerSummaryById
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
    if (customerId) {
      console.log('AdminCustomerDetailPage: Customer ID from params:', customerId);
      const fetchCustomerData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Fetch customer summary directly from 'customers' collection
          const customerSummaryData = await getCustomerSummaryById(customerId);
          console.log('AdminCustomerDetailPage: Fetched customer summary:', customerSummaryData);

          if (customerSummaryData) {
            setCustomer(customerSummaryData);
            // Fetch all orders for this customer phone number
            const customerOrders = await getOrdersByCustomerPhone(customerSummaryData.phone); // Use phone from summary for consistency
            console.log(`AdminCustomerDetailPage: Fetched ${customerOrders.length} orders for customer phone ${customerSummaryData.phone}`);
            setOrders(customerOrders); // Already sorted by service
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
        console.log('AdminCustomerDetailPage: customerId is missing from params.');
        setIsLoading(false);
        setError('שגיאה: מזהה לקוח חסר.');
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
    return (
        <div className="container mx-auto px-4 py-8">
            <p className="text-center text-lg">לא ניתן לטעון את פרטי הלקוח המבוקש.</p>
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
    
