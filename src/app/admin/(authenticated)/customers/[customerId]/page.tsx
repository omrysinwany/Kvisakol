
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCustomerSummaryById, updateCustomerGeneralNotes } from '@/services/order-service'; // Added updateCustomerGeneralNotes
import type { CustomerSummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { CustomerDetailView } from '@/components/admin/customer-detail-view';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerIdFromUrl = params.customerId as string;

  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('AdminCustomerDetailPage: Initializing. Customer ID from URL params:', customerIdFromUrl);

  useEffect(() => {
    const cleanedCustomerId = String(customerIdFromUrl || '').trim();
    console.log('AdminCustomerDetailPage: useEffect triggered. Cleaned customerId from URL params:', cleanedCustomerId);

    if (cleanedCustomerId) {
      const fetchCustomerData = async () => {
        setIsLoading(true);
        setError(null);
        setCustomer(null);
        
        try {
          console.log(`AdminCustomerDetailPage: Attempting to fetch customer summary for ID (phone): ${cleanedCustomerId} from 'customers' collection.`);
          const customerSummaryData = await getCustomerSummaryById(cleanedCustomerId);
          console.log('AdminCustomerDetailPage: Fetched customer summary from "customers" collection:', customerSummaryData);

          if (customerSummaryData) {
            setCustomer(customerSummaryData);
            console.log(`AdminCustomerDetailPage: Successfully set customer state for ${customerSummaryData.name}`);
          } else {
            setError(`הלקוח עם מזהה ${cleanedCustomerId} לא נמצא בקולקציית 'customers'.`);
            console.warn(`AdminCustomerDetailPage: No customer document found for ID ${cleanedCustomerId} in 'customers' collection.`);
            setCustomer(null);
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
  }, [customerIdFromUrl]);

  const handleSaveGeneralNotes = async (customerId: string, notes: string) => {
    if (!customer) return;
    try {
      const updatedCustomer = await updateCustomerGeneralNotes(customerId, notes);
      if (updatedCustomer) {
        setCustomer(updatedCustomer); // Update local state with the updated customer summary
        toast({
          title: "הערות כלליות נשמרו",
          description: "ההערות הכלליות ללקוח נשמרו בהצלחה.",
        });
      } else {
        toast({ variant: 'destructive', title: 'שגיאה', description: 'לא ניתן היה לשמור את ההערות הכלליות.' });
      }
    } catch (err) {
      console.error("Failed to save general agent notes:", err);
      toast({ variant: 'destructive', title: 'שגיאה', description: 'אירעה תקלה בשמירת ההערות הכלליות.' });
    }
  };


  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען פרטי לקוח...</p></div>;
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
            <p className="text-center text-lg">לא נמצא לקוח עם המזהה (טלפון) שהתקבל: {customerIdFromUrl}.</p>
            <p className="text-center text-sm text-muted-foreground">
                ייתכן שהלקוח עדיין לא ביצע הזמנות (ולכן לא קיים בקולקציית 'customers') או שהמזהה אינו תקין.
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
      <CustomerDetailView 
        customer={customer} 
        onSaveGeneralNotes={handleSaveGeneralNotes} 
      />
    </>
  );
}
