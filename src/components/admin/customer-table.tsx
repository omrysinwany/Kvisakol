
'use client';

import type { CustomerSummary } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, isBefore, subDays, startOfDay, endOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { UserCheck, UserX, Star, Repeat } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CustomerTableProps {
  customers: CustomerSummary[];
}

type CustomerDisplayStatusKey = 'vip' | 'new' | 'inactive' | 'returning' | null;

interface CustomerDisplayStatus {
  key: CustomerDisplayStatusKey;
  label: string;
  icon: React.ElementType;
  badgeClass: string;
}

const getCustomerDisplayBadge = (customer: CustomerSummary): CustomerDisplayStatus | null => {
  const now = endOfDay(new Date());
  const ninetyDaysAgo = subDays(now, 90);
  const isActuallyNew = customer.totalOrders === 1;
  const customerLastOrderDate = customer.lastOrderDate ? new Date(customer.lastOrderDate) : new Date(0); // Handle undefined lastOrderDate
  const isActuallyInactive = isBefore(customerLastOrderDate, ninetyDaysAgo);

  if (customer.totalOrders >= 5 && !isActuallyInactive) {
    return { 
      key: 'vip', 
      label: 'VIP', 
      icon: Star, 
      badgeClass: 'border-yellow-500 text-yellow-600 bg-yellow-500/10' 
    };
  }
  if (isActuallyNew) {
    return { 
      key: 'new', 
      label: 'חדש', 
      icon: UserCheck, 
      badgeClass: 'border-green-500 text-green-600 bg-green-500/10' 
    };
  }
  // An inactive customer takes precedence over "returning" if they meet the criteria for inactive
  // And they are not new (new status takes precedence)
  if (isActuallyInactive) { // No need to check !isActuallyNew here because 'new' is checked first
    return { 
      key: 'inactive', 
      label: 'לא פעיל', 
      icon: UserX, 
      badgeClass: 'border-amber-500 text-amber-600 bg-amber-500/10' 
    };
  }
  // If not VIP, not new, and not inactive, then they must be returning if totalOrders > 1
  if (customer.totalOrders > 1) { 
    return { 
      key: 'returning', 
      label: 'חוזר', 
      icon: Repeat, 
      badgeClass: 'border-sky-500 text-sky-600 bg-sky-500/10' 
    };
  }
  return null; // No specific status badge
};


export function CustomerTable({ customers }: CustomerTableProps) {
  const router = useRouter();

  const handleRowClick = (customerId: string) => {
    router.push(`/admin/customers/${customerId}`);
  };

  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">שם לקוח</TableHead>
          <TableHead className="text-right">סטטוס</TableHead>
          <TableHead className="text-right">טלפון</TableHead>
          <TableHead className="hidden md:table-cell text-right">כתובת אחרונה</TableHead>
          <TableHead className="hidden lg:table-cell text-right">הזמנה אחרונה</TableHead>
          <TableHead className="hidden sm:table-cell text-center">סה"כ הזמנות</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => {
          const displayStatus = getCustomerDisplayBadge(customer);
          return (
            <TableRow 
              key={customer.id} 
              onClick={() => handleRowClick(customer.phone)}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <TableCell className="font-medium">
                {customer.name}
              </TableCell>
              <TableCell>
                {displayStatus ? (
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${displayStatus.badgeClass}`}>
                    <displayStatus.icon className="h-3 w-3 ml-0.5" />
                    {displayStatus.label}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell className="hidden md:table-cell">{customer.latestAddress || '-'}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {customer.lastOrderDate ? format(new Date(customer.lastOrderDate), 'dd/MM/yyyy', { locale: he }) : '-'}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-center">{customer.totalOrders}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

