
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderTable } from '@/components/admin/order-table';
import { getOrdersForAdmin, updateOrderStatusService } from '@/services/order-service';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download, CalendarIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { format, startOfDay, endOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { usePathname } from 'next/navigation';

type StatusFilterValue = Order['status'] | 'all';

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
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const pathname = usePathname();

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
  }, [toast, pathname]);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updatedOrder = await updateOrderStatusService(orderId, newStatus);
      if (updatedOrder) {
        setAllOrders(prevOrders =>
          prevOrders.map(o => (o.id === orderId ? { ...updatedOrder } : o))
        );
        toast({
          title: "סטטוס הזמנה עודכן",
          description: `הסטטוס של הזמנה ${orderId.substring(orderId.length - 6)} שונה ל: ${statusTranslationsForFilter[newStatus]}.`,
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

  const handleClearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול הזמנות</h1>
        <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportOrders}>
            <Download className="ml-2 h-4 w-4" />
            ייצא הזמנות (CSV)
        </Button>
      </div>

      {/* Filter Section */}
      <div className="mb-6 p-3 border rounded-lg bg-card shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          {/* Status Filter */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status-filter">סנן לפי סטטוס</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilterValue)} name="status-filter" >
              <SelectTrigger id="status-filter" className="w-full">
                <SelectValue placeholder="סנן לפי סטטוס" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((statusKey) => (
                  <SelectItem key={statusKey} value={statusKey}>
                    {statusTranslationsForFilter[statusKey]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="start-date-popover">מתאריך</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                    id="start-date-popover"
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: he }) : <span>בחר תאריך התחלה</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => endDate ? date > endDate : false}
                    />
                </PopoverContent>
            </Popover>
          </div>
          
          {/* End Date & Clear Button */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="end-date-popover">עד תאריך</Label>
            <div className="flex gap-2 items-center">
              <Popover>
                  <PopoverTrigger asChild>
                      <Button
                      id="end-date-popover"
                      variant={"outline"}
                      className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                      )}
                      >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: he }) : <span>בחר תאריך סיום</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                      <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate && date < startDate}
                      initialFocus
                      />
                  </PopoverContent>
              </Popover>
              {(startDate || endDate) && (
                  <Button variant="ghost" onClick={handleClearDates} size="icon" className="h-10 w-10 shrink-0">
                      <X className="h-4 w-4" />
                      <span className="sr-only">נקה תאריכים</span>
                  </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>רשימת הזמנות ({filteredOrders.length})</CardTitle>
          <CardDescription>
            נהל את כל ההזמנות שהתקבלו מלקוחות. עקוב אחר סטטוסים ופרטי הזמנות.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length > 0 ? (
            <OrderTable orders={filteredOrders} onUpdateStatus={handleUpdateStatus} />
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

