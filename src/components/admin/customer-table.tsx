
'use client';

import type { CustomerSummary } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, isBefore, subDays, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { UserCheck, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CustomerTableProps {
  customers: CustomerSummary[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  const router = useRouter();

  const handleRowClick = (customerId: string) => {
    router.push(`/admin/customers/${customerId}`);
  };

  const formatPrice = (price: number) => {
    return `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">שם לקוח</TableHead>
          <TableHead className="text-right">טלפון</TableHead>
          <TableHead className="hidden md:table-cell text-right">כתובת אחרונה</TableHead>
          <TableHead className="hidden lg:table-cell text-right">הזמנה אחרונה</TableHead>
          <TableHead className="hidden sm:table-cell text-center">סה"כ הזמנות</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => {
          const isNewCustomer = customer.totalOrders === 1;
          const ninetyDaysAgo = startOfDay(subDays(new Date(), 90));
          const isInactiveCustomer = isBefore(new Date(customer.lastOrderDate), ninetyDaysAgo);

          return (
            <TableRow 
              key={customer.id} 
              onClick={() => handleRowClick(customer.phone)}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span>{customer.name}</span>
                  {isNewCustomer && (
                    <Badge variant="outline" className="border-green-500 text-green-600 text-[10px] px-1.5 py-0.5">
                      <UserCheck className="h-3 w-3 ml-0.5" />
                      חדש
                    </Badge>
                  )}
                  {isInactiveCustomer && !isNewCustomer && ( 
                    <Badge variant="outline" className="border-amber-500 text-amber-600 text-[10px] px-1.5 py-0.5">
                       <UserX className="h-3 w-3 ml-0.5" />
                      לא פעיל
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell className="hidden md:table-cell">{customer.latestAddress || '-'}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {format(new Date(customer.lastOrderDate), 'dd/MM/yyyy', { locale: he })}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-center">{customer.totalOrders}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
