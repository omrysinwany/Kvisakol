
'use client';

import { useRouter } from 'next/navigation'; // Import useRouter
import type { Order } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// Button component is no longer needed directly here if we remove the actions dropdown trigger button
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Hourglass, ClipboardCheck, Eye } from 'lucide-react'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';


interface OrderTableProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void; 
}

const statusTranslations: Record<Order['status'], string> = {
  new: 'חדשה',
  received: 'התקבלה',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
};

const statusColors: Record<Order['status'], string> = {
  new: 'bg-blue-500 hover:bg-blue-600',
  received: 'bg-amber-500 hover:bg-amber-600', 
  completed: 'bg-green-500 hover:bg-green-600',
  cancelled: 'bg-red-500 hover:bg-red-600',
};

const statusIcons: Record<Order['status'], React.ElementType> = {
  new: Hourglass,
  received: ClipboardCheck, 
  completed: CheckCircle,
  cancelled: XCircle,
}

export function OrderTable({ orders, onUpdateStatus }: OrderTableProps) {
  const router = useRouter(); 

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
          <TableHead className="text-right">סטטוס</TableHead>
          {/* Actions column removed */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const StatusIcon = statusIcons[order.status];
          
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
            <TableCell 
              className="text-right cursor-default"
              onClick={(e) => e.stopPropagation()} // Prevent row click when interacting with status badge
            >
              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <Badge 
                    variant="default" 
                    className={`${statusColors[order.status]} text-white cursor-pointer hover:opacity-80 transition-opacity text-xs px-2 py-0.5`} // Adjusted padding for Badge
                  >
                    <StatusIcon className="h-3 w-3 ml-1" /> {/* Adjusted margin for icon */}
                    {statusTranslations[order.status]}
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuLabel>שנה סטטוס</DropdownMenuLabel>
                  <DropdownMenuRadioGroup 
                    value={order.status} 
                    onValueChange={(newStatus) => onUpdateStatus(order.id, newStatus as Order['status'])}
                  >
                    {(['new', 'received', 'completed', 'cancelled'] as Order['status'][]).map((statusKey) => (
                      <DropdownMenuRadioItem key={statusKey} value={statusKey} className="cursor-pointer text-xs">
                        {statusTranslations[statusKey]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
            {/* Actions Td removed */}
          </TableRow>
        )})}
      </TableBody>
    </Table>
  );
}
