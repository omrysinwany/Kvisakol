
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderTable } from '@/components/admin/order-table';
import { AdminPaginationControls } from '@/components/admin/admin-pagination-controls';
import { getOrdersForAdmin, updateOrderStatusService } from '@/services/order-service';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download, CalendarIcon, X, UserSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type StatusFilterValue = Order['status'] | 'all'; 

const ITEMS_PER_PAGE = 10;

const statusTranslationsForFilter: Record<StatusFilterValue, string> = {
  all: 'כל הסטטוסים',
  new: 'חדשה',
  received: 'התקבלה',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
};

const availableStatuses: StatusFilterValue[] = ['all', 'new', 'received', 'completed', 'cancelled'];


export default function AdminOrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatusFilter = searchParams.get('status') as StatusFilterValue | null;
  const initialCustomerPhoneFilter = searchParams.get('customerPhone') as string | null;
  const initialPeriodFilter = searchParams.get('period') as string | null;


  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(initialStatusFilter || 'all');
  const [customerPhoneFilter, setCustomerPhoneFilter] = useState<string | null>(initialCustomerPhoneFilter);
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>(initialCustomerPhoneFilter || '');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
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

  useEffect(() => {
    const statusFromUrl = searchParams.get('status') as StatusFilterValue | null;
    if (statusFromUrl && availableStatuses.includes(statusFromUrl)) {
      setStatusFilter(statusFromUrl);
    } else if (!statusFromUrl && initialStatusFilter && !initialCustomerPhoneFilter && !initialPeriodFilter) {
      setStatusFilter('all');
    }

    const phoneFromUrl = searchParams.get('customerPhone');
    setCustomerPhoneFilter(phoneFromUrl);
    setCustomerPhoneInput(phoneFromUrl || '');


    const periodFromUrl = searchParams.get('period');
    if (periodFromUrl) {
      const today = new Date();
      if (periodFromUrl === 'today') {
        setStartDate(startOfDay(today));
        setEndDate(endOfDay(today));
      } else if (periodFromUrl === 'thisWeek') {
        const sevenDaysAgo = subDays(today, 6);
        setStartDate(startOfDay(sevenDaysAgo));
        setEndDate(endOfDay(today));
      }
    } else if (!phoneFromUrl && !statusFromUrl) { 
        setStartDate(undefined);
        setEndDate(undefined);
    }
    setCurrentPage(1);
  }, [searchParams, initialStatusFilter, initialCustomerPhoneFilter, initialPeriodFilter]);


  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updatedOrder = await updateOrderStatusService(orderId, newStatus);
      if (updatedOrder) {
        setAllOrders(prevOrders =>
          prevOrders.map(o => (o.id === orderId ? { ...updatedOrder } : o))
        );
        const statusKeyForToast = newStatus as keyof typeof statusTranslationsForFilter;
        toast({
          title: "סטטוס הזמנה עודכן",
          description: `הסטטוס של הזמנה ${orderId.substring(orderId.length - 6)} שונה ל: ${statusTranslationsForFilter[statusKeyForToast]}.`,
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
    let ordersToFilter = allOrders;

    if (customerPhoneFilter) {
      ordersToFilter = ordersToFilter.filter(order => order.customerPhone.includes(customerPhoneFilter));
    }

    if (statusFilter !== 'all') {
      ordersToFilter = ordersToFilter.filter(order => order.status === statusFilter);
    }

    if (startDate) {
      ordersToFilter = ordersToFilter.filter(order => new Date(order.orderTimestamp) >= startOfDay(startDate));
    }
    if (endDate) {
      ordersToFilter = ordersToFilter.filter(order => new Date(order.orderTimestamp) <= endOfDay(endDate));
    }

    return ordersToFilter;
  }, [allOrders, statusFilter, startDate, endDate, customerPhoneFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);

    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('period');
    router.replace(`/admin/orders?${newParams.toString()}`);
  };

  const handleCustomerPhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerPhoneInput(e.target.value);
  };

  const handleApplyCustomerPhoneFilter = () => {
    const trimmedPhone = customerPhoneInput.trim();
    setCustomerPhoneFilter(trimmedPhone || null);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams.toString());
    if (trimmedPhone) {
      newParams.set('customerPhone', trimmedPhone);
    } else {
      newParams.delete('customerPhone');
    }
    router.replace(`/admin/orders?${newParams.toString()}`);
  };
  
  const handleClearCustomerFilter = () => {
    setCustomerPhoneFilter(null);
    setCustomerPhoneInput('');
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('customerPhone');
    router.replace(`/admin/orders?${newParams.toString()}`);
  };


  const handleExportOrders = () => {
    toast({
      title: "ייצוא הזמנות",
      description: "פונקציונליות ייצוא ל-CSV תתווסף בעתיד.",
    });
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען הזמנות...</p></div>;
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">ניהול הזמנות</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex flex-row items-center justify-between space-x-2 rtl:space-x-reverse">
            <div>
              <CardTitle className="text-xl">רשימת הזמנות ({filteredOrders.length})</CardTitle>
              <CardDescription>
                נהל את כל ההזמנות שהתקבלו מלקוחות. עקוב אחר סטטוסים ופרטי הזמנות.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleExportOrders} className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap">
                <Download className="ml-1.5 h-3.5 w-3.5" />
                ייצא CSV
            </Button>
          </div>
          
          <div className="pt-3 space-y-2">
            {/* Row 1: Phone Search and Status Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
              <div className="relative">
                <UserSearch className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="order-customer-phone-search"
                  type="tel"
                  placeholder="טלפון לקוח..."
                  value={customerPhoneInput}
                  onChange={handleCustomerPhoneInputChange}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleApplyCustomerPhoneFilter(); }}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 rtl:pr-10"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as StatusFilterValue); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-full px-3 text-xs">
                    <SelectValue placeholder="סינון לפי סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((statusKey) => (
                      <SelectItem key={statusKey} value={statusKey} className="text-xs">
                        {statusTranslationsForFilter[statusKey as StatusFilterValue]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Date Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
              <Popover>
                  <PopoverTrigger asChild>
                      <Button
                      variant={"outline"}
                      size="sm"
                      className={cn(
                          "h-9 w-full px-2 text-xs justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                      )}
                      >
                      <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                      {startDate ? format(startDate, "d/M/yy", { locale: he }) : <span className="text-xs">מתאריך</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                      <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {setStartDate(date); setCurrentPage(1);}}
                      initialFocus
                      disabled={(date) => endDate ? date > endDate : false}
                      />
                  </PopoverContent>
              </Popover>
              <Popover>
                  <PopoverTrigger asChild>
                      <Button
                      variant={"outline"}
                      size="sm"
                      className={cn(
                          "h-9 w-full px-2 text-xs justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                      )}
                      >
                      <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                      {endDate ? format(endDate, "d/M/yy", { locale: he }) : <span className="text-xs">עד תאריך</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                      <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {setEndDate(date); setCurrentPage(1);}}
                      disabled={(date) => startDate && date < startDate}
                      initialFocus
                      />
                  </PopoverContent>
              </Popover>
            </div>
            
            {/* Clear buttons and badges */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
                {(startDate || endDate) && (
                    <Button variant="ghost" onClick={() => {handleClearDates(); setCurrentPage(1);}} size="icon" className="h-8 w-8 shrink-0">
                        <X className="h-3.5 w-3.5" />
                        <span className="sr-only">נקה תאריכים</span>
                    </Button>
                )}
                 {customerPhoneFilter && (
                    <Badge variant="secondary" className="text-xs py-1 px-2">
                      <UserSearch className="h-3.5 w-3.5 ml-1" />
                      מציג הזמנות עבור לקוח: {customerPhoneFilter}
                    </Badge>
                  )}
                 {(customerPhoneFilter || (customerPhoneInput && customerPhoneInput !== customerPhoneFilter) ) && (
                     <Button variant="outline" size="xs" onClick={handleClearCustomerFilter} className="h-auto py-0.5 px-1.5 text-xs">
                        <X className="h-3 w-3 ml-0.5" />
                        נקה סינון לקוח
                    </Button>
                 )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedOrders.length > 0 ? (
             <>
                <OrderTable orders={paginatedOrders} onUpdateStatus={handleUpdateStatus} />
                {totalPages > 1 && (
                    <AdminPaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    />
                )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {allOrders.length === 0 ? 'לא קיימות הזמנות במערכת.' :
                 (customerPhoneFilter || statusFilter !== 'all' || startDate || endDate) ? 'לא נמצאו הזמנות התואמות את הסינון הנוכחי.' :
                 'לא קיימות הזמנות במערכת.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
    

    