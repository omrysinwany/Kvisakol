
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllProductsForAdmin } from "@/services/product-service";
import { getOrdersForAdmin } from "@/services/order-service";
import type { Product, Order } from "@/lib/types";
import { DollarSign, Package, ShoppingCart, Activity } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DashboardSummary {
  totalProducts: number;
  totalOrders: number;
  newOrders: number; // Strictly status 'new' (unviewed)
  totalRevenue: number;
  latestOrders: Order[];
  popularProducts: Product[]; 
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
        const newOrders = orders.filter(o => o.status === 'new').length;
        const totalRevenue = orders
          .filter(o => o.status === 'completed') 
          .reduce((sum, order) => sum + order.totalAmount, 0);
        
        const popularProducts = products.slice(0, 3);
        const latestOrders = orders.slice(0, 5);

        setSummary({
          totalProducts,
          totalOrders,
          newOrders,
          totalRevenue,
          latestOrders,
          popularProducts
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="md:col-span-2">
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
            <div className="text-2xl font-bold">{summary.newOrders}</div>
            <p className="text-xs text-muted-foreground">מתוך {summary.totalOrders} הזמנות בסה"כ</p>
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
            <CardTitle className="text-sm font-medium">פעילות אחרונה</CardTitle> 
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.latestOrders.filter(o => new Date(o.orderTimestamp) > new Date(Date.now() - 24*60*60*1000)).length}</div> 
            <p className="text-xs text-muted-foreground">הזמנות ב-24 שעות אחרונות</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>הזמנות אחרונות</CardTitle>
            <CardDescription>סקירה מהירה של {summary.latestOrders.length} ההזמנות האחרונות.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.latestOrders.length > 0 ? summary.latestOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                </div>
                <div className="text-right">
                   <p className="font-semibold">{formatPrice(order.totalAmount)}</p>
                   <Link href={`/admin/orders/${order.id}`} className="text-xs text-primary hover:underline">צפה בפרטים</Link>
                </div>
              </div>
            )) : <p className="text-muted-foreground text-center">אין הזמנות אחרונות להצגה.</p>}
             <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/admin/orders">כל ההזמנות</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>מוצרים לדוגמה</CardTitle>
            <CardDescription>מספר מוצרים מהקטלוג.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.popularProducts.length > 0 ? summary.popularProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
              </div>
            )) : <p className="text-muted-foreground text-center">אין מוצרים להצגה.</p>}
            <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/admin/products">כל המוצרים</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
