
'use client';

import { useRouter } from 'next/navigation'; // Import useRouter
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
  received: 'bg-amber-500 hover:bg-amber-600',
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
  const router = useRouter(); // Initialize router

  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`;
  }

  const handleRowClick = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`);
  };

  return (
    <Table className="text-xs">
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
          <TableRow 
            key={order.id} 
            onClick={() => handleRowClick(order.id)}
            className={`cursor-pointer ${order.status === 'new' && !order.isViewedByAgent ? 'bg-primary/5' : ''}`}
          >
            <TableCell className="font-medium">
              #{order.id.substring(order.id.length - 6)}
            </TableCell>
            <TableCell>{order.customerName}</TableCell>
            <TableCell className="hidden md:table-cell">
              {format(new Date(order.orderTimestamp), 'dd/MM/yyyy HH:mm', { locale: he })}
            </TableCell>
            <TableCell className="hidden sm:table-cell">{formatPrice(order.totalAmount)}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()} className="cursor-default">
              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <Badge 
                    variant="default" 
                    className={`${displayStatus.colorClass} text-white cursor-pointer hover:opacity-80 transition-opacity`}
                  >
                    <DisplayStatusIcon className="h-3 w-3 mr-1.5" />
                    {displayStatus.text}
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuLabel>שנה סטטוס</DropdownMenuLabel>
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
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
            <TableCell className="text-left">
              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <Button 
                    aria-haspopup="true" 
                    size="icon" 
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()} 
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">פתח תפריט פעולות</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}> 
                  <DropdownMenuLabel>פעולות עבור הזמנה</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => router.push(`/admin/orders/${order.id}`)} className="flex items-center gap-2 cursor-pointer">
                    <Eye className="h-4 w-4" />
                    צפה בפרטי הזמנה
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
