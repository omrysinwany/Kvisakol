
'use client';

import Link from 'next/link';
import type { Order } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Edit, CheckCircle, XCircle, Hourglass, AlertCircle } from 'lucide-react'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OrderTableProps {
  orders: Order[];
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


export function OrderTable({ orders, onUpdateStatus }: OrderTableProps) {
  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>מספר הזמנה</TableHead>
          <TableHead>לקוח</TableHead>
          <TableHead className="hidden md:table-cell">תאריך</TableHead>
          <TableHead className="hidden sm:table-cell">סכום</TableHead>
          <TableHead>סטטוס</TableHead>
          <TableHead className="text-left">פעולות</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const StatusIcon = statusIcons[order.status];
          const isNewUnviewed = order.status === 'new' && !order.isViewedByAgent;
          return (
          <TableRow 
            key={order.id} 
            className={cn(isNewUnviewed && "bg-primary/5")}
          >
            <TableCell className="font-medium">
              <div className="flex items-center">
                {isNewUnviewed && (
                  <AlertCircle className="h-4 w-4 text-blue-500 mr-2 animate-pulse" title="הזמנה חדשה שלא נצפתה"/>
                )}
                <Link href={`/admin/orders/${order.id}`} className="hover:underline text-primary">
                  #{order.id.substring(order.id.length - 6)}
                </Link>
              </div>
            </TableCell>
            <TableCell className={cn(isNewUnviewed && "font-semibold")}>{order.customerName}</TableCell>
            <TableCell className={cn("hidden md:table-cell", isNewUnviewed && "font-semibold")}>
              {format(new Date(order.orderTimestamp), 'dd/MM/yyyy HH:mm', { locale: he })}
            </TableCell>
            <TableCell className={cn("hidden sm:table-cell", isNewUnviewed && "font-semibold")}>{formatPrice(order.totalAmount)}</TableCell>
            <TableCell>
              <Badge variant="default" className={`${statusColors[order.status]} text-white`}>
                <StatusIcon className="h-3 w-3 mr-1.5" /> {/* Changed ml-1.5 to mr-1.5 for RTL */}
                {statusTranslations[order.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-left">
              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">פתח תפריט פעולות</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>פעולות עבור הזמנה</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-2 cursor-pointer">
                      <Eye className="h-4 w-4" />
                      צפה בפרטי הזמנה
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
                      <Edit className="h-4 w-4" />
                      <span>שנה סטטוס</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
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
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )})}
      </TableBody>
    </Table>
  );
}
