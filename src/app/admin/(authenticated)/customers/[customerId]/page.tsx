
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
import { updateOrderStatusService } from '@/services/order-service';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('AdminCustomerDetailPage: Initializing. Customer ID from URL params:', customerId);

  useEffect(() => {
    console.log('AdminCustomerDetailPage: useEffect triggered. Customer ID from URL params:', customerId);
    if (customerId) {
      const fetchCustomerData = async () => {
        setIsLoading(true);
        setError(null);
        setCustomer(null);
        setOrders([]);
        try {
          console.log(`AdminCustomerDetailPage: Attempting to fetch customer summary for ID (phone): ${customerId} from 'customers' collection.`);
          const customerSummaryData = await getCustomerSummaryById(customerId);
          console.log('AdminCustomerDetailPage: Fetched customer summary from "customers" collection:', customerSummaryData);

          if (customerSummaryData) {
            setCustomer(customerSummaryData);
            
            // Use the phone from the fetched customer summary to query orders, ensuring consistency
            const phoneToQueryOrders = customerSummaryData.phone;
            console.log(`AdminCustomerDetailPage: Customer summary found. Phone from summary: ${phoneToQueryOrders}. ID to query orders with (original customerId from URL): ${customerId}`);

            if (!phoneToQueryOrders) {
                console.error("AdminCustomerDetailPage: Phone number from customer summary is missing or empty. Cannot fetch orders.");
                setError("שגיאה: מספר טלפון חסר בפרטי הלקוח ולא ניתן לשלוף הזמנות.");
                setOrders([]);
            } else {
                console.log(`AdminCustomerDetailPage: Attempting to fetch orders for customer phone: >>${phoneToQueryOrders}<< from 'orders' collection.`);
                const customerOrders = await getOrdersByCustomerPhone(phoneToQueryOrders);
                console.log(`AdminCustomerDetailPage: Fetched ${customerOrders.length} orders for customer phone ${phoneToQueryOrders}. Order IDs: [${customerOrders.map(o => o.id).join(', ')}]`);
                if (customerOrders.length > 0) {
                  console.log('AdminCustomerDetailPage: Details of fetched orders:', customerOrders.map(o => ({id: o.id, name: o.customerName, phoneInOrder: o.customerPhone})));
                }
                setOrders(customerOrders.sort((a, b) => new Date(b.orderTimestamp).getTime() - new Date(a.orderTimestamp).getTime()));
            }
          } else {
            setError(`הלקוח המבוקש עם מזהה (טלפון) ${customerId} לא נמצא במערכת הלקוחות (בקולקציית 'customers'). ייתכן שלא ביצע הזמנות עדיין או שהמזהה לא תקין.`);
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
        toast({
          title: "סטטוס הזמנה עודכן",
          description: `הסטטוס של הזמנה ${orderId.substring(orderId.length - 6)} שונה ל: ${statusTranslationsToast[newStatus]}.`,
        });
        
        if (newStatus === 'completed' || newStatus === 'cancelled') {
            if (customer) {
                console.log(`AdminCustomerDetailPage: Order ${orderId} status changed to ${newStatus}. Refreshing customer summary for customer ID ${customer.id}.`);
                const updatedCustomerSummary = await getCustomerSummaryById(customer.id);
                if (updatedCustomerSummary) {
                    setCustomer(updatedCustomerSummary);
                    console.log('AdminCustomerDetailPage: Customer summary refreshed:', updatedCustomerSummary);
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

  if (!customer) {
    return (
        <div className="container mx-auto px-4 py-8">
            <p className="text-center text-lg">לא נמצא לקוח עם המזהה (טלפון) שהתקבל: {customerId}.</p>
            <p className="text-center text-sm text-muted-foreground">
                ייתכן שהלקוח עדיין לא ביצע הזמנות או שהמזהה אינו תקין. בדוק אם הלקוח קיים בקולקציית 'customers'.
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
  
  if (customer && orders.length === 0 && !isLoading && !error) {
    console.log(`AdminCustomerDetailPage: Customer ${customer.name} (phone: ${customer.phone}) summary found, but they have 0 orders fetched from 'orders' collection for this phone number.`);
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
