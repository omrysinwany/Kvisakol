
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllProductsForAdmin } from "@/services/product-service";
import { getOrdersForAdmin } from "@/services/order-service";
import type { Product, Order } from "@/lib/types";
import { DollarSign, Package, ShoppingCart, Activity, ClipboardCheck, Eye, Users, CalendarDays, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isWithinInterval, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { he } from 'date-fns/locale';


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
  totalRevenue: number;
  latestOrders: Order[];
  ordersToday: number;
  ordersThisWeek: number;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const [products, orders] = await Promise.all([
          getAllProductsForAdmin(),
          getOrdersForAdmin()
        ]);

        const totalProducts = products.filter(p => p.isActive).length;
        const totalOrders = orders.length;
        const newOrdersUnviewedCount = orders.filter(o => o.status === 'new').length;
        const receivedOrdersCount = orders.filter(o => o.status === 'received').length;
        
        const ordersTodayCount = orders.filter(o => isToday(new Date(o.orderTimestamp))).length;
        const sevenDaysAgo = subDays(new Date(), 6); // From today up to 6 days ago (inclusive of today makes 7 days)
        const today = new Date();
        const ordersThisWeekCount = orders.filter(o => 
            isWithinInterval(new Date(o.orderTimestamp), { start: sevenDaysAgo, end: today })
        ).length;
        
        const totalRevenue = orders
          .filter(o => o.status === 'completed')
          .reduce((sum, order) => sum + order.totalAmount, 0);

        const latestOrders = orders.slice(0, 5);

        setSummary({
          totalProducts,
          totalOrders,
          newOrdersUnviewed: newOrdersUnviewedCount,
          receivedOrders: receivedOrdersCount,
          totalRevenue,
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

  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`;
  }

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

      <div className="grid grid-cols-2 gap-4">
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ הכנסות (שהושלמו)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">מהזמנות שהושלמו</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הזמנות חדשות (טרם נצפו)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
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
