
'use client';

import Link from 'next/link';
import type { Order } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Edit, CheckCircle, XCircle, Hourglass } from 'lucide-react'; 
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
// cn is not used after removing conditional classNames for rows/cells based on isNewUnviewed
// import { cn } from '@/lib/utils';

interface OrderTableProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void; 
}

// Base status properties, used by OrderDetailView and as a base here
const baseStatusTranslations: Record<Order['status'], string> = {
  new: 'חדשה',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
};

const baseStatusColors: Record<Order['status'], string> = {
  new: 'bg-blue-500 hover:bg-blue-600',
  completed: 'bg-green-500 hover:bg-green-600',
  cancelled: 'bg-red-500 hover:bg-red-600',
};

const baseStatusIcons: Record<Order['status'], React.ElementType> = {
  new: Hourglass,
  completed: CheckCircle,
  cancelled: XCircle,
}

// Function to determine the display properties for the status badge in the table
const getDisplayStatus = (order: Order): { text: string; colorClass: string; icon: React.ElementType } => {
  if (order.status === 'new') {
    if (!order.isViewedByAgent) {
      // New and unviewed
      return { 
        text: baseStatusTranslations['new'], 
        colorClass: baseStatusColors['new'], 
        icon: baseStatusIcons['new'] 
      };
    } else {
      // New and viewed
      return { 
        text: `${baseStatusTranslations['new']} (נצפתה)`, 
        colorClass: baseStatusColors['new'], // Same color as 'new'
        icon: Eye // Different icon
      }; 
    }
  }
  if (order.status === 'completed') {
    return { 
      text: baseStatusTranslations['completed'], 
      colorClass: baseStatusColors['completed'], 
      icon: baseStatusIcons['completed'] 
    };
  }
  if (order.status === 'cancelled') {
    return { 
      text: baseStatusTranslations['cancelled'], 
      colorClass: baseStatusColors['cancelled'], 
      icon: baseStatusIcons['cancelled'] 
    };
  }
  // Fallback, should ideally not happen with strict types
  return { text: order.status, colorClass: 'bg-gray-500 hover:bg-gray-600', icon: MoreHorizontal };
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
          <TableRow key={order.id} > {/* Removed conditional className for row background */}
            <TableCell className="font-medium">
              {/* Removed AlertCircle icon */}
              <Link href={`/admin/orders/${order.id}`} className="hover:underline text-primary">
                #{order.id.substring(order.id.length - 6)}
              </Link>
            </TableCell>
            <TableCell>{order.customerName}</TableCell> {/* Removed conditional font-semibold */}
            <TableCell className="hidden md:table-cell"> {/* Removed conditional font-semibold */}
              {format(new Date(order.orderTimestamp), 'dd/MM/yyyy HH:mm', { locale: he })}
            </TableCell>
            <TableCell className="hidden sm:table-cell">{formatPrice(order.totalAmount)}</TableCell> {/* Removed conditional font-semibold */}
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
                          {(['new', 'completed', 'cancelled'] as Order['status'][]).map((statusKey) => (
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
