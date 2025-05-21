import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { placeholderOrders, placeholderProducts } from "@/lib/placeholder-data";
import { DollarSign, Package, ShoppingCart, Users, Activity } from "lucide-react";
import Link from "next/link";

// Simulate data fetching for summary
async function getDashboardSummary() {
  const totalProducts = placeholderProducts.filter(p => p.isActive).length;
  const totalOrders = placeholderOrders.length;
  const newOrders = placeholderOrders.filter(o => o.status === 'new').length;
  const totalRevenue = placeholderOrders
    .filter(o => o.status === 'completed' || o.status === 'shipped') // Assuming these count as revenue
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return { totalProducts, totalOrders, newOrders, totalRevenue };
}

export default async function AdminDashboardPage() {
  const summary = await getDashboardSummary();
  
  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`;
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
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
            <CardTitle className="text-sm font-medium">הזמנות חדשות</CardTitle>
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
            <CardTitle className="text-sm font-medium">פעילות אחרונה</CardTitle> {/* Placeholder */}
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">הזמנות ב-24 שעות אחרונות</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>הזמנות אחרונות</CardTitle>
            <CardDescription>סקירה מהירה של 5 ההזמנות האחרונות.</CardDescription>
          </CardHeader>
          <CardContent>
            {placeholderOrders.slice(0, 5).map(order => (
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
            ))}
             <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/admin/orders">כל ההזמנות</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>מוצרים פופולריים (דוגמה)</CardTitle>
            <CardDescription>מוצרים שהוזמנו הכי הרבה לאחרונה.</CardDescription>
          </CardHeader>
          <CardContent>
            {placeholderProducts.slice(0, 3).map(product => (
              <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/admin/products">כל המוצרים</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
