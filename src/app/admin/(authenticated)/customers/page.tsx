
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerTable } from '@/components/admin/customer-table';
import { AdminPaginationControls } from '@/components/admin/admin-pagination-controls';
import { getUniqueCustomersFromOrders } from '@/services/order-service';
import type { CustomerSummary } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download } from 'lucide-react';

const ITEMS_PER_PAGE = 15;

export default function AdminCustomersPage() {
  const [allCustomers, setAllCustomers] = useState<CustomerSummary[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      customersToFilter = customersToFilter.filter(customer =>
        customer.name.toLowerCase().includes(lowerSearchTerm) ||
        customer.phone.includes(lowerSearchTerm)
      );
    }
    setFilteredCustomers(customersToFilter);
    setCurrentPage(1);
  }, [searchTerm, allCustomers]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
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
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">ניהול לקוחות</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="חיפוש לפי שם או טלפון..."
              className="pl-10 rtl:pr-10 w-full sm:max-w-xs"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCustomers} className="text-xs">
            <Download className="ml-1.5 h-3.5 w-3.5" />
            ייצא CSV
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">רשימת לקוחות ({filteredCustomers.length})</CardTitle>
          <CardDescription>
            סקירה של כל הלקוחות שביצעו הזמנות במערכת.
          </CardDescription>
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
                {allCustomers.length === 0 ? 'לא קיימים לקוחות במערכת.' : 'לא נמצאו לקוחות התואמים את החיפוש.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
