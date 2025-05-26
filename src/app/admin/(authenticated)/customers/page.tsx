
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerTable } from '@/components/admin/customer-table';
import { AdminPaginationControls } from '@/components/admin/admin-pagination-controls';
import { getUniqueCustomers } from '@/services/order-service';
import type { CustomerSummary } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, isWithinInterval, startOfDay, endOfDay, isBefore } from 'date-fns';

const ITEMS_PER_PAGE = 15;

type LastOrderDateFilter = 'all' | 'last7days' | 'last30days' | 'over90days';
type CustomerStatusFilter = 'all' | 'new' | 'vip' | 'inactive' | 'returning';

const lastOrderDateFilterTranslations: Record<LastOrderDateFilter, string> = {
  all: 'כל התקופות',
  last7days: 'ב-7 ימים אחרונים',
  last30days: 'ב-30 ימים אחרונים',
  over90days: 'מעל 90 יום',
};

const customerStatusFilterTranslations: Record<CustomerStatusFilter, string> = {
  all: 'כל הסטטוסים',
  new: 'חדשים',
  vip: 'VIP',
  inactive: 'לא פעילים',
  returning: 'חוזרים',
};

const getCustomerDisplayStatus = (customer: CustomerSummary): CustomerStatusFilter => {
  const now = endOfDay(new Date());
  const ninetyDaysAgo = subDays(now, 90);
  const isNewCustomer = customer.totalOrders === 1;
  const customerLastOrderDate = new Date(customer.lastOrderDate);
  const isInactive = isBefore(customerLastOrderDate, ninetyDaysAgo);

  if (customer.totalOrders >= 5 && !isInactive) return 'vip';
  if (isNewCustomer) return 'new';
  if (isInactive) return 'inactive';
  if (customer.totalOrders > 1 && !isInactive) return 'returning';
  return 'all'; // Should ideally not happen if logic is correct
};


export default function AdminCustomersPage() {
  const [allCustomers, setAllCustomers] = useState<CustomerSummary[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastOrderFilter, setLastOrderFilter] = useState<LastOrderDateFilter>('all');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<CustomerStatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const fetchedCustomers = await getUniqueCustomers();
        setAllCustomers(fetchedCustomers);
        setFilteredCustomers(fetchedCustomers);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לטעון את רשימת הלקוחות." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, [toast]);

  useEffect(() => {
    let customersToFilter = [...allCustomers];
    const now = endOfDay(new Date());

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      customersToFilter = customersToFilter.filter(customer =>
        customer.name.toLowerCase().includes(lowerSearchTerm) ||
        customer.phone.includes(lowerSearchTerm)
      );
    }

    if (lastOrderFilter !== 'all') {
      customersToFilter = customersToFilter.filter(customer => {
        if (!customer.lastOrderDate) return false;
        const customerLastOrderDate = new Date(customer.lastOrderDate);
        if (lastOrderFilter === 'last7days') {
          const sevenDaysAgo = startOfDay(subDays(now, 6));
          return isWithinInterval(customerLastOrderDate, { start: sevenDaysAgo, end: now });
        }
        if (lastOrderFilter === 'last30days') {
          const thirtyDaysAgo = startOfDay(subDays(now, 29));
          return isWithinInterval(customerLastOrderDate, { start: thirtyDaysAgo, end: now });
        }
        if (lastOrderFilter === 'over90days') {
          const ninetyDaysAgo = subDays(now, 90);
          return isBefore(customerLastOrderDate, ninetyDaysAgo);
        }
        return true;
      });
    }

    if (customerStatusFilter !== 'all') {
      customersToFilter = customersToFilter.filter(customer => {
        return getCustomerDisplayStatus(customer) === customerStatusFilter;
      });
    }

    setFilteredCustomers(customersToFilter);
    setCurrentPage(1);
  }, [searchTerm, lastOrderFilter, customerStatusFilter, allCustomers]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleLastOrderFilterChange = (value: LastOrderDateFilter) => {
    setLastOrderFilter(value);
  };

  const handleCustomerStatusFilterChange = (value: CustomerStatusFilter) => {
    setCustomerStatusFilter(value);
  };

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען רשימת לקוחות...</p></div>;
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">ניהול לקוחות</h1>
      </div>

      <Card className="shadow-lg">
      <CardHeader>
          <div className="flex flex-row items-center justify-between space-x-2 rtl:space-x-reverse">
            <div>
              <CardTitle className="text-xl">רשימת לקוחות ({filteredCustomers.length})</CardTitle>
              <CardDescription>
                סקירה של כל הלקוחות שביצעו הזמנות במערכת.
              </CardDescription>
            </div>
            {/* Export button removed */}
          </div>
           {/* Filters Area */}
          <div className="pt-3">
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="relative col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="customer-search"
                    type="search"
                    placeholder="חיפוש שם או טלפון..."
                    className="pl-10 rtl:pr-10 w-full h-9 text-xs"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <Select value={lastOrderFilter} onValueChange={handleLastOrderFilterChange}>
                  <SelectTrigger id="last-order-filter" className="h-9 w-full px-3 text-xs">
                    <SelectValue placeholder="סינון לפי הזמנה אחרונה" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(lastOrderDateFilterTranslations).map(([key, value]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Select value={customerStatusFilter} onValueChange={handleCustomerStatusFilterChange}>
                  <SelectTrigger id="customer-status-filter" className="h-9 w-full px-3 text-xs">
                    <SelectValue placeholder="סינון לפי סטטוס לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(customerStatusFilterTranslations).map(([key, value]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedCustomers.length > 0 ? (
            <>
              <CustomerTable customers={paginatedCustomers} />
              {totalPages > 1 && (
                <AdminPaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {allCustomers.length === 0 ? 'לא קיימים לקוחות במערכת.' : 'לא נמצאו לקוחות התואמים את החיפוש או הסינון.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
    

    
