
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { getAllProductsForAdmin } from "@/services/product-service";
import { getOrdersForAdmin } from "@/services/order-service";
import type { Product, Order } from "@/lib/types";
import { DollarSign, Package, ShoppingCart, Activity, ClipboardCheck, Eye, Users, CalendarDays, CalendarCheck, CalendarIcon, X, Hourglass, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isWithinInterval, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";


const statusTranslationsForDashboard: Record<Order['status'], string> = {
  new: 'חדשה',
  received: 'התקבלה',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
};

const statusColorsForDashboard: Record<Order['status'], string> = {
  new: 'bg-blue-500',
  received: 'bg-amber-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
};

interface DashboardSummary {
  totalProducts: number;
  totalOrders: number;
  newOrdersUnviewed: number;
  receivedOrders: number;
  allTimeRevenue: number; 
  latestOrders: Order[];
  ordersToday: number;
  ordersThisWeek: number;
}

type RevenuePeriod = 'allTime' | 'today' | 'thisWeek' | 'thisMonth' | 'custom';
const revenuePeriodTranslations: Record<RevenuePeriod, string> = {
  allTime: 'כל הזמן',
  today: 'היום',
  thisWeek: 'השבוע',
  thisMonth: 'החודש',
  custom: 'מותאם אישית',
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [selectedRevenuePeriod, setSelectedRevenuePeriod] = useState<RevenuePeriod>('thisMonth');
  const [customRevenueStartDate, setCustomRevenueStartDate] = useState<Date | undefined>();
  const [customRevenueEndDate, setCustomRevenueEndDate] = useState<Date | undefined>();
  const [filteredRevenue, setFilteredRevenue] = useState<number>(0);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const [products, orders] = await Promise.all([
          getAllProductsForAdmin(),
          getOrdersForAdmin()
        ]);
        setAllOrders(orders);

        const totalProducts = products.filter(p => p.isActive).length;
        const totalOrders = orders.length;
        const newOrdersUnviewedCount = orders.filter(o => o.status === 'new').length;
        const receivedOrdersCount = orders.filter(o => o.status === 'received').length;
        
        const ordersTodayCount = orders.filter(o => isToday(new Date(o.orderTimestamp))).length;
        const sevenDaysAgo = subDays(new Date(), 6); 
        const today = new Date();
        const ordersThisWeekCount = orders.filter(o => 
            isWithinInterval(new Date(o.orderTimestamp), { start: startOfDay(sevenDaysAgo), end: endOfDay(today) })
        ).length;
        
        const allTimeRevenue = orders
          .filter(o => o.status === 'completed')
          .reduce((sum, order) => sum + order.totalAmount, 0);

        const latestOrders = orders.slice(0, 5);

        setSummary({
          totalProducts,
          totalOrders,
          newOrdersUnviewed: newOrdersUnviewedCount,
          receivedOrders: receivedOrdersCount,
          allTimeRevenue,
          latestOrders,
          ordersToday: ordersTodayCount,
          ordersThisWeek: ordersThisWeekCount,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לטעון את נתוני לוח הבקרה." });
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, [toast]);

  useEffect(() => {
    if (!allOrders.length && summary?.allTimeRevenue === undefined) {
        setFilteredRevenue(0);
        return;
    }

    let relevantOrders = allOrders.filter(o => o.status === 'completed');
    const now = new Date();

    switch (selectedRevenuePeriod) {
        case 'today':
            relevantOrders = relevantOrders.filter(o => isToday(new Date(o.orderTimestamp)));
            break;
        case 'thisWeek': 
            const lastSevenDaysStart = startOfDay(subDays(now, 6));
            relevantOrders = relevantOrders.filter(o => 
                isWithinInterval(new Date(o.orderTimestamp), { start: lastSevenDaysStart, end: endOfDay(now) })
            );
            break;
        case 'thisMonth':
            relevantOrders = relevantOrders.filter(o => 
                isWithinInterval(new Date(o.orderTimestamp), { start: startOfMonth(now), end: endOfMonth(now) })
            );
            break;
        case 'custom':
            if (customRevenueStartDate && customRevenueEndDate) {
                relevantOrders = relevantOrders.filter(o => 
                    isWithinInterval(new Date(o.orderTimestamp), { start: startOfDay(customRevenueStartDate), end: endOfDay(customRevenueEndDate) })
                );
            } else if (customRevenueStartDate) {
                 relevantOrders = relevantOrders.filter(o => new Date(o.orderTimestamp) >= startOfDay(customRevenueStartDate));
            } else if (customRevenueEndDate) {
                 relevantOrders = relevantOrders.filter(o => new Date(o.orderTimestamp) <= endOfDay(customRevenueEndDate));
            } else {
                 // If custom is selected but no dates are set, show 0 or based on some default
                 relevantOrders = []; // Or allTime if that's preferred default for empty custom
            }
            break;
        case 'allTime':
        default:
            // No additional date filtering beyond 'completed' status - uses all completed orders
            break;
    }
    const newFilteredRevenue = relevantOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    setFilteredRevenue(newFilteredRevenue);

}, [allOrders, selectedRevenuePeriod, customRevenueStartDate, customRevenueEndDate, summary]);


  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`;
  }

  const handleClearCustomDates = () => {
    setCustomRevenueStartDate(undefined);
    setCustomRevenueEndDate(undefined);
    // Optionally, reset to a default period like 'thisMonth' or 'allTime' if 'custom' with no dates isn't desired
    // setSelectedRevenuePeriod('thisMonth'); 
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען נתוני לוח בקרה...</p></div>;
  }

  if (!summary) {
    return <div className="container mx-auto px-4 py-8"><p>לא ניתן לטעון את נתוני לוח הבקרה.</p></div>;
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">לוח בקרה</h1>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/admin/products/new">הוסף מוצר חדש</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center">
                    <DollarSign className="h-6 w-6 text-muted-foreground ml-2" />
                    <CardTitle className="text-xl font-semibold">
                        הכנסות בתקופה הנבחרת
                    </CardTitle>
                </div>
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="min-w-[130px] justify-between">
                      {revenuePeriodTranslations[selectedRevenuePeriod]}
                      <ChevronDown className="h-4 w-4 opacity-50 mr-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>בחר תקופה</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedRevenuePeriod} onValueChange={(value) => setSelectedRevenuePeriod(value as RevenuePeriod)}>
                      <DropdownMenuRadioItem value="thisMonth">החודש</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="thisWeek">השבוע</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="today">היום</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="allTime">כל הזמן</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="custom">מותאם אישית</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {selectedRevenuePeriod === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-2 my-3 items-center p-2 border rounded-md bg-muted/30">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      size="sm"
                      className={cn(
                        "w-full sm:w-[160px] justify-start text-left font-normal text-xs",
                        !customRevenueStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                      {customRevenueStartDate ? format(customRevenueStartDate, "PPP", { locale: he }) : <span>מתאריך</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customRevenueStartDate}
                      onSelect={setCustomRevenueStartDate}
                      initialFocus
                      disabled={(date) => customRevenueEndDate ? date > customRevenueEndDate : false}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                       size="sm"
                      className={cn(
                        "w-full sm:w-[160px] justify-start text-left font-normal text-xs",
                        !customRevenueEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                      {customRevenueEndDate ? format(customRevenueEndDate, "PPP", { locale: he }) : <span>עד תאריך</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customRevenueEndDate}
                      onSelect={setCustomRevenueEndDate}
                      initialFocus
                      disabled={(date) => customRevenueStartDate ? date < customRevenueStartDate : false}
                    />
                  </PopoverContent>
                </Popover>
                {(customRevenueStartDate || customRevenueEndDate) && (
                    <Button variant="ghost" size="icon" onClick={handleClearCustomDates} className="h-9 w-9">
                        <X className="h-4 w-4" />
                        <span className="sr-only">נקה תאריכים</span>
                    </Button>
                )}
              </div>
            )}
            <div className="text-3xl font-bold mt-1">{formatPrice(filteredRevenue)}</div>
            <p className="text-xs text-muted-foreground">
                סה"כ מהזמנות <span className="font-medium">שהושלמו</span> בתקופה שנבחרה.
                {selectedRevenuePeriod !== 'allTime' && summary.allTimeRevenue > 0 && ` (הכנסות כל הזמן: ${formatPrice(summary.allTimeRevenue)})`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הזמנות חדשות (טרם נצפו)</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.newOrdersUnviewed}</div>
            <p className="text-xs text-muted-foreground">מתוך {summary.totalOrders} הזמנות בסה"כ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הזמנות שהתקבלו (נצפו)</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.receivedOrders}</div>
            <p className="text-xs text-muted-foreground">ממתינות להמשך טיפול</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הזמנות מהיום</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.ordersToday}</div>
             <p className="text-xs text-muted-foreground">התקבלו היום</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הזמנות מהשבוע</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.ordersThisWeek}</div>
            <p className="text-xs text-muted-foreground">ב-7 הימים האחרונים</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מוצרים פעילים</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts}</div>
            <p className="text-xs text-muted-foreground">זמינים בקטלוג</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ הזמנות</CardTitle>
             <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground">הזמנות במערכת</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>הזמנות אחרונות</CardTitle>
            <CardDescription>סקירה מהירה של {summary.latestOrders.length > 0 ? Math.min(summary.latestOrders.length, 5) : '0'} ההזמנות האחרונות.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.latestOrders.length > 0 ? summary.latestOrders.slice(0,5).map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default" className={`${statusColorsForDashboard[order.status]} text-white text-xs`}>
                    {statusTranslationsForDashboard[order.status]}
                  </Badge>
                  <div className="text-right">
                     <p className="font-semibold">{formatPrice(order.totalAmount)}</p>
                     <Link href={`/admin/orders/${order.id}`} className="text-xs text-primary hover:underline">צפה בפרטים</Link>
                  </div>
                </div>
              </div>
            )) : <p className="text-muted-foreground text-center">אין הזמנות אחרונות להצגה.</p>}
             <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/admin/orders">כל ההזמנות</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

