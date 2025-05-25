
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerTable } from '@/components/admin/customer-table';
import { AdminPaginationControls } from '@/components/admin/admin-pagination-controls';
import { getUniqueCustomersFromOrders } from '@/services/order-service';
import type { CustomerSummary } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, isWithinInterval, startOfDay, endOfDay, isBefore } from 'date-fns';

const ITEMS_PER_PAGE = 15;

type LastOrderDateFilter = 'all' | 'last7days' | 'last30days' | 'over90days';

const lastOrderDateFilterTranslations: Record<LastOrderDateFilter, string> = {
  all: 'כל התקופות',
  last7days: 'ב-7 ימים אחרונים',
  last30days: 'ב-30 ימים אחרונים',
  over90days: 'מעל 90 יום (לא פעיל)',
};

export default function AdminCustomersPage() {
  const [allCustomers, setAllCustomers] = useState<CustomerSummary[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastOrderFilter, setLastOrderFilter] = useState<LastOrderDateFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const fetchedCustomers = await getUniqueCustomersFromOrders();
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

    setFilteredCustomers(customersToFilter);
    setCurrentPage(1);
  }, [searchTerm, lastOrderFilter, allCustomers]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleLastOrderFilterChange = (value: LastOrderDateFilter) => {
    setLastOrderFilter(value);
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

  const handleExportCustomers = () => {
    toast({
      title: "ייצוא לקוחות",
      description: "פונקציונליות ייצוא ל-CSV תתווסף בעתיד.",
    });
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען רשימת לקוחות...</p></div>;
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">ניהול לקוחות</h1>
      </div>
      
      <div className="mb-4 p-3 border rounded-lg bg-muted/30 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="relative">
            <label htmlFor="customer-search" className="text-xs font-medium text-muted-foreground block mb-1.5">חיפוש</label>
            <div className="relative">
              <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="customer-search"
                type="search"
                placeholder="שם או טלפון..." 
                className="pl-10 rtl:pr-10 w-full h-9 text-xs"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <label htmlFor="last-order-filter" className="text-xs font-medium text-muted-foreground block mb-1.5">הזמנה אחרונה</label>
            <Select value={lastOrderFilter} onValueChange={handleLastOrderFilterChange}>
              <SelectTrigger id="last-order-filter" className="h-9 w-full sm:w-auto min-w-[180px] px-3 text-xs">
                <SelectValue />
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
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-x-2 rtl:space-x-reverse">
          <div>
            <CardTitle className="text-xl">רשימת לקוחות ({filteredCustomers.length})</CardTitle>
            <CardDescription>
              סקירה של כל הלקוחות שביצעו הזמנות במערכת.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleExportCustomers} className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap">
            <Download className="ml-1.5 h-3.5 w-3.5" />
            ייצא CSV
          </Button>
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
    
