
'use client';

import type { CustomerSummary } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
// import { Button } from '@/components/ui/button';
// import { MoreHorizontal } from 'lucide-react';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { useRouter } from 'next/navigation';

interface CustomerTableProps {
  customers: CustomerSummary[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  // const router = useRouter();

  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`;
  }

  // const handleRowClick = (customerId: string) => {
    // Potentially navigate to a customer detail page in the future
    // router.push(`/admin/customers/${customerId}`); 
  // };

  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">שם לקוח</TableHead>
          <TableHead className="text-right">טלפון</TableHead>
          <TableHead className="hidden md:table-cell text-right">הזמנה אחרונה</TableHead>
          <TableHead className="hidden sm:table-cell text-right">סה"כ הזמנות</TableHead>
          <TableHead className="text-right">סה"כ הוצאות</TableHead>
          {/* <TableHead className="text-left">פעולות</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow 
            key={customer.id} 
            // onClick={() => handleRowClick(customer.id)} // Future: navigate to customer detail
            // className="cursor-pointer"
          >
            <TableCell className="font-medium">{customer.name}</TableCell>
            <TableCell>{customer.phone}</TableCell>
            <TableCell className="hidden md:table-cell">
              {format(new Date(customer.lastOrderDate), 'dd/MM/yyyy', { locale: he })}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-center">{customer.totalOrders}</TableCell>
            <TableCell className="text-right">{formatPrice(customer.totalSpent)}</TableCell>
            {/* <TableCell className="text-left">
              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">פתח תפריט פעולות</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleRowClick(customer.id)}>
                    צפה בפרטי לקוח
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell> */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
