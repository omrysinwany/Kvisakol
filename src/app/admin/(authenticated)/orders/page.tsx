
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderTable } from '@/components/admin/order-table';
import { AdminPaginationControls } from '@/components/admin/admin-pagination-controls';
import { getOrdersForAdmin, updateOrderStatusService } from '@/services/order-service';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download, CalendarIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useSearchParams } from 'next/navigation';

type StatusFilterValue = Order['status'] | 'all';

const ITEMS_PER_PAGE = 10; 

const statusTranslationsForFilter: Record<StatusFilterValue | 'received', string> = {
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
  
  const searchParams = useSearchParams(); 
  const initialStatusFilter = searchParams.get('status') as StatusFilterValue | null;

  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(initialStatusFilter || 'all');
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
    } else if (!statusFromUrl && initialStatusFilter) {
      // If status was initially set from URL and then removed, reset to 'all'
      // This handles navigating back or clearing URL params
      // setStatusFilter('all'); 
    } else if (!statusFromUrl && !initialStatusFilter) {
      // Default to 'all' if no URL param and no initial filter
      // setStatusFilter('all');
    }
    
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
    } 
    setCurrentPage(1);
  }, [searchParams, initialStatusFilter]);


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
  }, [allOrders, statusFilter, startDate, endDate]);
  
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

      <div className="mb-4 p-3 border rounded-lg bg-muted/30 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as StatusFilterValue); setCurrentPage(1); }}>
            <SelectTrigger className="h-9 w-auto px-3 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableStatuses.map((statusKey) => (
                <SelectItem key={statusKey} value={statusKey} className="text-xs">
                  {statusTranslationsForFilter[statusKey as StatusFilterValue | 'received']}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
              <PopoverTrigger asChild>
                  <Button
                  variant={"outline"}
                  size="sm" 
                  className={cn(
                      "h-9 w-auto px-2 text-xs justify-start text-left font-normal",
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
                      "h-9 w-auto px-2 text-xs justify-start text-left font-normal",
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

          {(startDate || endDate) && (
              <Button variant="ghost" onClick={() => {handleClearDates(); setCurrentPage(1);}} size="icon" className="h-9 w-9 shrink-0">
                  <X className="h-4 w-4" />
                  <span className="sr-only">נקה תאריכים</span>
              </Button>
          )}
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-x-2">
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
                {allOrders.length === 0 ? 'לא קיימות הזמנות במערכת.' : 'לא נמצאו הזמנות התואמות את הסינון הנוכחי.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

