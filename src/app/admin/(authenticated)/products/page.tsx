
'use client'; 

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductTable } from '@/components/admin/product-table';
import { AdminPaginationControls } from '@/components/admin/admin-pagination-controls';
import { getAllProductsForAdmin, deleteProductService, toggleProductActiveStatusService } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { PlusCircle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 15;
const ALL_CATEGORIES_VALUE = "all"; // Define a constant for "all categories"

export default function AdminProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES_VALUE); // Default to "all"
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const fetchedProducts = await getAllProductsForAdmin();
        setAllProducts(fetchedProducts);
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(fetchedProducts.map(p => p.category).filter(Boolean) as string[])).sort();
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Failed to fetch products for admin:", error);
        toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לטעון את רשימת המוצרים."});
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [toast]);

  useEffect(() => {
    let productsToFilter = allProducts;

    if (selectedCategory && selectedCategory !== ALL_CATEGORIES_VALUE) { // Check against "all"
      productsToFilter = productsToFilter.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      productsToFilter = productsToFilter.filter(p =>
        p.name.toLowerCase().includes(lowerSearchTerm) ||
        (p.description && p.description.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    setFilteredProducts(productsToFilter);
    setCurrentPage(1); // Reset to first page on filter change
  }, [selectedCategory, searchTerm, allProducts]);

  const handleDeleteProduct = async (productId: string, productName: string) => {
     if (window.confirm(`האם אתה בטוח שברצונך למחוק את המוצר "${productName}"?`)) {
        try {
            const success = await deleteProductService(productId);
            if (success) {
                setAllProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
                toast({
                    title: "מוצר נמחק",
                    description: `המוצר "${productName}" נמחק בהצלחה.`,
                });
            } else {
                 toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה למחוק את המוצר."});
            }
        } catch (error) {
            console.error("Failed to delete product:", error);
            toast({ variant: "destructive", title: "שגיאה", description: "אירעה תקלה במחיקת המוצר."});
        }
     }
  };

  const handleToggleActive = async (productId: string, productName: string, currentIsActive: boolean) => {
    try {
        const updatedProduct = await toggleProductActiveStatusService(productId, !currentIsActive);
        if (updatedProduct) {
            setAllProducts(prevProducts => 
              prevProducts.map(p => p.id === productId ? { ...p, isActive: updatedProduct.isActive } : p)
            );
            toast({
                title: "סטטוס מוצר עודכן",
                description: `המוצר "${productName}" כעת ${updatedProduct.isActive ? "פעיל" : "לא פעיל"}.`,
            });
        } else {
            toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לעדכן את סטטוס המוצר."});
        }
    } catch (error) {
        console.error("Failed to toggle product active status:", error);
        toast({ variant: "destructive", title: "שגיאה", description: "אירעה תקלה בעדכון סטטוס המוצר."});
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען מוצרים...</p></div>;
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול מוצרים</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <PlusCircle className="ml-2 h-4 w-4" />
            הוסף מוצר חדש
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle>רשימת מוצרים</CardTitle>
              <CardDescription>
                נהל את כל המוצרים בקטלוג שלך.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="חיפוש מוצר..."
                  className="pl-10 rtl:pr-10 w-full sm:w-[200px] lg:w-[250px]"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full sm:w-[180px] lg:w-[200px]">
                  <SelectValue placeholder="סינון לפי קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES_VALUE}>כל הקטגוריות</SelectItem> {/* Use constant value */}
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedProducts.length > 0 ? (
            <>
              <ProductTable products={paginatedProducts} onDeleteProduct={handleDeleteProduct} onToggleActive={handleToggleActive} />
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
              <p className="text-muted-foreground mb-4">
                {allProducts.length === 0 ? 'לא קיימים מוצרים במערכת. התחל על ידי הוספת מוצר חדש.' : 'לא נמצאו מוצרים התואמים את החיפוש או הסינון.'}
              </p>
              {allProducts.length === 0 && (
                <Button asChild>
                  <Link href="/admin/products/new">הוסף מוצר</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

