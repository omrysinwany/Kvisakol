
'use client';

import type { Order, OrderItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Printer, CheckCircle, XCircle, Hourglass, Phone, MapPin, FileText } from 'lucide-react'; // Removed Edit, Truck
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';

interface OrderDetailViewProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
}

const statusTranslations: Record<Order['status'], string> = {
  new: 'חדשה',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
};

const statusColors: Record<Order['status'], string> = {
  new: 'bg-blue-500 hover:bg-blue-600',
  completed: 'bg-green-500 hover:bg-green-600',
  cancelled: 'bg-red-500 hover:bg-red-600',
};

const statusIcons: Record<Order['status'], React.ElementType> = {
  new: Hourglass,
  completed: CheckCircle,
  cancelled: XCircle,
}

export function OrderDetailView({ order, onUpdateStatus }: OrderDetailViewProps) {
  const formatPrice = (price: number) => `₪${price.toFixed(2)}`;
  const StatusIcon = statusIcons[order.status];

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">הזמנה #{order.id.substring(order.id.length - 6)}</CardTitle>
            <CardDescription>
              תאריך הזמנה: {format(new Date(order.orderTimestamp), 'dd/MM/yyyy HH:mm', { locale: he })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
             <Badge variant="default" className={`${statusColors[order.status]} text-white text-sm px-3 py-1`}>
                <StatusIcon className="h-4 w-4 ml-1.5" />
                {statusTranslations[order.status]}
              </Badge>
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">שנה סטטוס</Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent>
                    <DropdownMenuRadioGroup 
                    value={order.status} 
                    onValueChange={(newStatus) => onUpdateStatus(order.id, newStatus as Order['status'])}
                    >
                    {(['new', 'completed', 'cancelled'] as Order['status'][]).map((statusKey) => (
                        <DropdownMenuRadioItem key={statusKey} value={statusKey} className="cursor-pointer">
                        {statusTranslations[statusKey]}
                        </DropdownMenuRadioItem>
                    ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="ml-2 h-4 w-4" />
              הדפס
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">פרטי לקוח</h3>
              <div className="space-y-1 text-sm">
                <p><strong>שם:</strong> {order.customerName}</p>
                <p className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-muted-foreground"/> <strong>טלפון:</strong> 
                  <a href={`tel:${order.customerPhone}`} className="text-primary hover:underline">{order.customerPhone}</a>
                </p>
                <p className="flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground mt-1"/> <strong>כתובת:</strong> {order.customerAddress}
                </p>
              </div>
            </div>
            {order.customerNotes && (
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-1"><FileText className="w-4 h-4"/>הערות לקוח</h3>
                <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{order.customerNotes}</p>
              </div>
            )}
          </div>

          <h3 className="text-lg font-semibold mb-2">פריטים בהזמנה</h3>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מוצר</TableHead>
                  <TableHead className="text-center">כמות</TableHead>
                  <TableHead className="text-right">מחיר ליחידה</TableHead>
                  <TableHead className="text-right">סה"כ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatPrice(item.priceAtOrder)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatPrice(item.priceAtOrder * item.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end items-center bg-muted/30 p-4 rounded-b-md">
            <div className="text-xl font-bold">
              <span>סכום כולל: </span>
              <span className="text-primary">{formatPrice(order.totalAmount)}</span>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
