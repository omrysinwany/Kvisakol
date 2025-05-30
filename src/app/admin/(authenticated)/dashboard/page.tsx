
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { getProductById } from "@/services/product-service";
import { getOrdersForAdmin, getTopCustomers, getRecentOrders, getNewCustomersThisMonthCount } from "@/services/order-service";
import type { Order, CustomerSummary } from "@/lib/types";
import { Package, ClipboardCheck, Eye, Users, CalendarDays, CalendarCheck, CalendarIcon, X, Hourglass, ChevronDown, ListOrdered, Trophy, ListChecks, UserPlus, DollarSign } from "lucide-react";
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
  newOrdersUnviewed: number;
  receivedOrders: number;
  latestOrders: Order[];
}

interface PopularProduct {
  id: string;
  name: string;
  count: number;
  unitsPerBox?: number; // Add unitsPerBox to the interface
}

type RevenuePeriod = 'allTime' | 'today' | 'thisWeek' | 'thisMonth' | 'custom';
const revenuePeriodTranslations: Record<RevenuePeriod, string> = {
  allTime: 'כל הזמן',
  today: 'היום',
  thisWeek: 'השבוע הנוכחי',
  thisMonth: 'החודש הנוכחי',
  custom: 'מותאם אישית',
};

type OrdersCountPeriod = 'thisWeek' | 'thisMonth' | 'allTime';

const ordersCountPeriodDisplayTranslations: Record<OrdersCountPeriod, string> = {
  thisWeek: 'השבוע הנוכחי',
  thisMonth: 'החודש הנוכחי',
  allTime: 'כל הזמן',
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

  const [topCustomers, setTopCustomers] = useState<CustomerSummary[] | null>(null);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[] | null>(null);
  const [newCustomersThisMonth, setNewCustomersThisMonth] = useState<number>(0);

  const [selectedOrdersCountPeriod, setSelectedOrdersCountPeriod] = useState<OrdersCountPeriod>('thisWeek');
  const [filteredOrdersCount, setFilteredOrdersCount] = useState<number>(0);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const [ordersData, topCustomersData, recentOrdersData, newCustomersCount] = await Promise.all([
          getOrdersForAdmin(),
          getTopCustomers(3),
          getRecentOrders(7),
          getNewCustomersThisMonthCount(),
        ]);
  
        // הגדרות בסיסיות
        setAllOrders(ordersData);
        setTopCustomers(topCustomersData);
        setNewCustomersThisMonth(newCustomersCount);
  
        const newOrdersUnviewedCount = ordersData.filter(o => o.status === 'new').length;
        const receivedOrdersCount   = ordersData.filter(o => o.status === 'received').length;
        const latestOrders           = ordersData.slice(0, 5);
  
        setSummary({
          newOrdersUnviewed: newOrdersUnviewedCount,
          receivedOrders:    receivedOrdersCount,
          latestOrders,
        });
  
        // חישוב מוצרים פופולריים בקרטונים
        if (recentOrdersData.length > 0) {
          const productCounts: Record<string, number> = {};
          recentOrdersData.forEach(order => {
            order.items.forEach(item => {
              const cartons = Math.ceil(item.quantity / (item.unitsPerBox ?? 1));
              productCounts[item.productId] = (productCounts[item.productId] || 0) + cartons;
            });
          });
  
          const sortedProductIds = Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([productId]) => productId);
  
          const popularProductsDetails = await Promise.all(
            sortedProductIds.map(async (productId) => {
              const product = await getProductById(productId);
              return {
                id:          productId,
                name:        product?.name || 'מוצר לא ידוע',
                count:       productCounts[productId],      // קרטונים
                unitsPerBox: product?.unitsPerBox,          // לשימוש עתידי
              };
            })
          );
          setPopularProducts(popularProductsDetails);
        } else {
          setPopularProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          variant:    "destructive",
          title:      "שגיאה",
          description:"לא ניתן היה לטעון את נתוני לוח הבקרה."
        });
      } finally {
        setIsLoading(false);
      }
    }
  
    fetchDashboardData();
  }, [toast]);
  

  useEffect(() => {
    if (!allOrders.length) { 
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
             relevantOrders = relevantOrders.filter(o => 
                isWithinInterval(new Date(o.orderTimestamp), { start: startOfWeek(now, { locale: he }), end: endOfWeek(now, { locale: he }) })
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
                 relevantOrders = []; 
            }
            break;
        case 'allTime':
        default:
            break;
    }
    const newFilteredRevenue = relevantOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    setFilteredRevenue(newFilteredRevenue);

  }, [allOrders, selectedRevenuePeriod, customRevenueStartDate, customRevenueEndDate]);

  useEffect(() => {
    if (!allOrders.length) {
      setFilteredOrdersCount(0);
      return;
    }
    let ordersForCount = [...allOrders]; 
    const now = new Date();

    switch (selectedOrdersCountPeriod) {
      case 'thisWeek':
        ordersForCount = ordersForCount.filter(o =>
          isWithinInterval(new Date(o.orderTimestamp), { start: startOfWeek(now, { locale: he }), end: endOfWeek(now, { locale: he }) })
        );
        break;
      case 'thisMonth':
        ordersForCount = ordersForCount.filter(o =>
          isWithinInterval(new Date(o.orderTimestamp), { start: startOfMonth(now), end: endOfMonth(now) })
        );
        break;
      case 'allTime':
      default:
        break;
    }
    setFilteredOrdersCount(ordersForCount.length);
  }, [allOrders, selectedOrdersCountPeriod]);

  const formatPrice = (price: number) => {
    return `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const handleClearCustomDates = () => {
    setCustomRevenueStartDate(undefined);
    setCustomRevenueEndDate(undefined);
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען נתוני לוח בקרה...</p></div>;
  }

  if (!summary) {
    return <div className="container mx-auto px-4 py-8"><p>לא ניתן לטעון את נתוני לוח הבקרה.</p></div>;
  }

  return (
    <>
      <div className="w-full py-4 mb-8 text-center bg-card shadow-sm rounded-lg">
        <h1 className="text-3xl font-bold tracking-tight text-primary">לוח בקרה</h1>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
      <Link href="/admin/orders?status=new" className="block hover:shadow-lg transition-shadow rounded-lg">
      <Card className="h-full text-center">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex flex-col items-center gap-1.5">
            <Hourglass className="h-4 w-4 text-muted-foreground" />
            הזמנות חדשות !
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.newOrdersUnviewed}</div>
          <p className="text-xs text-muted-foreground">הזמנות שטרם נפתחו</p>
        </CardContent>
      </Card>
    </Link>

    <Link href="/admin/orders?status=received" className="block hover:shadow-lg transition-shadow rounded-lg">
      <Card className="h-full text-center">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex flex-col items-center gap-1.5">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            הזמנות שהתקבלו
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.receivedOrders}</div>
          <p className="text-xs text-muted-foreground">ממתינות להמשך טיפול</p>
        </CardContent>
      </Card>
    </Link>

    <Card className="h-full text-center">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium flex flex-col items-center gap-1.5">
        <ListOrdered className="h-4 w-4 text-muted-foreground" />
        סה"כ הזמנות (לתקופה)
      </CardTitle>
    </CardHeader>

      <CardContent className="flex flex-col items-center gap-[0.5px]">
      <div className="text-2xl font-bold">{filteredOrdersCount}</div>
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-5 px-1 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground">
            {ordersCountPeriodDisplayTranslations[selectedOrdersCountPeriod]}
            <ChevronDown className="h-3 w-3 opacity-75 mr-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={selectedOrdersCountPeriod}
            onValueChange={(value) => setSelectedOrdersCountPeriod(value as OrdersCountPeriod)}
          >
            <DropdownMenuRadioItem value="thisWeek" className="text-xs">
              {ordersCountPeriodDisplayTranslations.thisWeek}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="thisMonth" className="text-xs">
              {ordersCountPeriodDisplayTranslations.thisMonth}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="allTime" className="text-xs">
              {ordersCountPeriodDisplayTranslations.allTime}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardContent>
    </Card>

    <Card className="h-full text-center">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex flex-col items-center gap-1.5">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          לקוחות חדשים החודש
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{newCustomersThisMonth}</div>
        <p className="text-xs text-muted-foreground">הצטרפו החודש</p>
      </CardContent>
    </Card>
        
        <Card className="col-span-2"> 
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListOrdered className="h-5 w-5 text-primary"/>הזמנות אחרונות</CardTitle>
            <CardDescription>סקירה מהירה של {summary.latestOrders.length > 0 ? Math.min(summary.latestOrders.length, 5) : '0'} ההזמנות האחרונות.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.latestOrders.length > 0 ? summary.latestOrders.slice(0,5).map(order => (
              <div key={order.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                <div className="flex items-center gap-2">
                   <span className="text-xs text-muted-foreground">({format(new Date(order.orderTimestamp), 'dd/MM', { locale: he })})</span>
                  <div>
 <p className="font-medium text-sm">{order.customerBusinessName || order.customerName}</p>
 <a href={`tel:${order.customerPhone}`} className="text-xs text-primary hover:underline">{order.customerPhone}</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default" className={`${statusColorsForDashboard[order.status]} text-white text-xs px-1.5 py-0.5`}>
                    {statusTranslationsForDashboard[order.status]}
                  </Badge>
                  <div className="text-right">
 <p className="font-semibold text-sm">{formatPrice(order.totalAmount)}</p>
                     <Link href={`/admin/orders/${order.id}`} className="text-xs text-primary hover:underline">צפה בפרטים</Link>
                  </div>
                </div>
              </div>
            )) : <p className="text-muted-foreground text-center py-4">אין הזמנות אחרונות להצגה.</p>}
             <Button variant="outline" className="w-full mt-4 text-xs" asChild size="sm">
                <Link href="/admin/orders">כל ההזמנות</Link>
            </Button>
          </CardContent>
        </Card>

        {topCustomers && topCustomers.length > 0 && (
          <Card className="col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500"/>לקוחות מובילים</CardTitle>
              <CardDescription>3 הלקוחות עם סך ההוצאות הגבוה ביותר.</CardDescription>
            </CardHeader>
            <CardContent>
              {topCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                  <div>
 <Link href={`/admin/customers/${customer.id}`} className="font-medium text-sm text-primary hover:underline">
 {customer.customerBusinessName && customer.customerBusinessName !== '' ? customer.customerBusinessName : customer.name}
 </Link>
 {customer.customerBusinessName && customer.customerBusinessName !== '' && customer.customerBusinessName !== customer.name && (
 <p className="text-xs text-muted-foreground">{customer.name}</p>
 )}
                  </div>
                  <p className="font-semibold text-sm">{formatPrice(customer.totalSpent)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {popularProducts && popularProducts.length > 0 && (
          <Card className="col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-green-500"/>
                מוצרים נפוצים לאחרונה
              </CardTitle>
              <CardDescription>3 המוצרים הנפוצים ביותר בהזמנות מהשבוע האחרון.</CardDescription>
            </CardHeader>
            <CardContent>
              {popularProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                   <Link href={`/admin/products/edit/${product.id}`} className="font-medium text-sm text-primary hover:underline">{product.name}</Link>
                  <p className="text-sm text-muted-foreground">נמכרו: {product.count} קרטונים</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-primary"/>
                    הכנסות בתקופה הנבחרת
                </CardTitle>
            </div>
            <div className="flex justify-end mt-1">
                <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-between min-w-[130px] text-xs">
                    {revenuePeriodTranslations[selectedRevenuePeriod]}
                    <ChevronDown className="h-3.5 w-3.5 opacity-75 mr-1" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs">בחר תקופה</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedRevenuePeriod} onValueChange={(value) => setSelectedRevenuePeriod(value as RevenuePeriod)}>
                    <DropdownMenuRadioItem value="thisMonth" className="text-xs">{revenuePeriodTranslations.thisMonth}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="thisWeek" className="text-xs">{revenuePeriodTranslations.thisWeek}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="today" className="text-xs">{revenuePeriodTranslations.today}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="allTime" className="text-xs">{revenuePeriodTranslations.allTime}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="custom" className="text-xs">{revenuePeriodTranslations.custom}</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {selectedRevenuePeriod === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-2 my-4 items-center p-3 border rounded-lg bg-muted/40 shadow-sm">
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
            <div className="text-2xl font-bold mt-2">{formatPrice(filteredRevenue)}</div>
            <p className="text-sm text-muted-foreground">
                סה"כ מהזמנות <span className="font-medium">שהושלמו</span> בתקופה שנבחרה.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

