
'use client';

import Link from 'next/link';
import type { Order } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Edit, CheckCircle, XCircle, Hourglass, ClipboardCheck } from 'lucide-react'; 
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


interface OrderTableProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void; 
}

const baseStatusTranslations: Record<Order['status'], string> = {
  new: 'חדשה',
  received: 'התקבלה',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
};

const baseStatusColors: Record<Order['status'], string> = {
  new: 'bg-blue-500 hover:bg-blue-600',
  received: 'bg-amber-500 hover:bg-amber-600', // Changed to amber
  completed: 'bg-green-500 hover:bg-green-600',
  cancelled: 'bg-red-500 hover:bg-red-600',
};

const baseStatusIcons: Record<Order['status'], React.ElementType> = {
  new: Hourglass,
  received: ClipboardCheck,
  completed: CheckCircle,
  cancelled: XCircle,
}

const getDisplayStatus = (order: Order): { text: string; colorClass: string; icon: React.ElementType } => {
  const statusKey = order.status;
  return { 
    text: baseStatusTranslations[statusKey] || statusKey, 
    colorClass: baseStatusColors[statusKey] || 'bg-gray-500 hover:bg-gray-600', 
    icon: baseStatusIcons[statusKey] || MoreHorizontal 
  };
};


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
          const displayStatus = getDisplayStatus(order);
          const DisplayStatusIcon = displayStatus.icon;
          
          return (
          <TableRow key={order.id} className={order.status === 'new' && !order.isViewedByAgent ? 'bg-primary/5' : ''}>
            <TableCell className="font-medium">
              {order.status === 'new' && !order.isViewedByAgent && <Hourglass className="h-4 w-4 mr-2 inline-block text-blue-500" />}
              <Link href={`/admin/orders/${order.id}`} className="hover:underline text-primary">
                #{order.id.substring(order.id.length - 6)}
              </Link>
            </TableCell>
            <TableCell>{order.customerName}</TableCell>
            <TableCell className="hidden md:table-cell">
              {format(new Date(order.orderTimestamp), 'dd/MM/yyyy HH:mm', { locale: he })}
            </TableCell>
            <TableCell className="hidden sm:table-cell">{formatPrice(order.totalAmount)}</TableCell>
            <TableCell>
              <Badge variant="default" className={`${displayStatus.colorClass} text-white`}>
                <DisplayStatusIcon className="h-3 w-3 mr-1.5" />
                {displayStatus.text}
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
                          {(['new', 'received', 'completed', 'cancelled'] as Order['status'][]).map((statusKey) => (
                            <DropdownMenuRadioItem key={statusKey} value={statusKey} className="cursor-pointer">
                              {baseStatusTranslations[statusKey]}
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

