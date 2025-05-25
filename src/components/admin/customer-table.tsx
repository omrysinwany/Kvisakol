
'use client';

import type { CustomerSummary } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CustomerTableProps {
  customers: CustomerSummary[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  const router = useRouter();

  const formatPrice = (price: number) => {
    return `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const handleViewCustomerOrders = (phone: string) => {
    router.push(`/admin/orders?customerPhone=${encodeURIComponent(phone)}`);
  };

  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">שם לקוח</TableHead>
          <TableHead className="text-right">טלפון</TableHead>
          <TableHead className="hidden md:table-cell text-right">כתובת אחרונה</TableHead>
          <TableHead className="hidden lg:table-cell text-right">הזמנה אחרונה</TableHead>
          <TableHead className="hidden sm:table-cell text-right">סה"כ הזמנות</TableHead>
          <TableHead className="text-right">סה"כ הוצאות</TableHead>
          <TableHead className="text-left">פעולות</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell className="font-medium">{customer.name}</TableCell>
            <TableCell>{customer.phone}</TableCell>
            <TableCell className="hidden md:table-cell">{customer.latestAddress || '-'}</TableCell>
            <TableCell className="hidden lg:table-cell">
              {format(new Date(customer.lastOrderDate), 'dd/MM/yyyy', { locale: he })}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-center">{customer.totalOrders}</TableCell>
            <TableCell className="text-right">{formatPrice(customer.totalSpent)}</TableCell>
            <TableCell className="text-left">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewCustomerOrders(customer.phone)}
                title="צפה בהזמנות הלקוח"
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">צפה בהזמנות הלקוח</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
