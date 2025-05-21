'use client'; // Required for useState, useEffect, event handlers

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderTable } from '@/components/admin/order-table';
import { placeholderOrders } from '@/lib/placeholder-data';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Simulate API calls or state management for order data
// In a real app, these would interact with Firebase/backend

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching orders, sort by newest first
    const sortedOrders = [...placeholderOrders].sort((a, b) => 
      new Date(b.orderTimestamp).getTime() - new Date(a.orderTimestamp).getTime()
    );
    setOrders(sortedOrders);
    setIsLoading(false);
  }, []);

  const handleUpdateStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prevOrders =>
      prevOrders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    // Here you would also call your backend to update the order status
    toast({
      title: "סטטוס הזמנה עודכן",
      description: `הסטטוס של הזמנה ${orderId.substring(orderId.length -6)} שונה ל: ${newStatus}.`,
    });
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען הזמנות...</p></div>;
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול הזמנות</h1>
        <Button variant="outline">
            <Download className="ml-2 h-4 w-4" />
            ייצא הזמנות (CSV)
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>רשימת הזמנות</CardTitle>
          <CardDescription>
            נהל את כל ההזמנות שהתקבלו מלקוחות. עקוב אחר סטטוסים ופרטי הזמנות.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <OrderTable orders={orders} onUpdateStatus={handleUpdateStatus} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">לא נמצאו הזמנות.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
