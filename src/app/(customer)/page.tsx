
'use client';

import { ProductList } from '@/components/customer/product-list';
import { getProductsForCatalog } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { CategoryFilter } from '@/components/customer/category-filter';
import { PaginationControls } from '@/components/customer/pagination-controls';

const ITEMS_PER_PAGE = 10;

export default function CatalogPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const products = await getProductsForCatalog();
        setAllProducts(products);
        setFilteredProducts(products); // Initially, all products are shown
      } catch (error) {
        console.error("Failed to fetch products:", error);
        // Handle error appropriately, e.g., show a message to the user
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(allProducts.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(uniqueCategories).sort();
  }, [allProducts]);

  useEffect(() => {
    let productsToFilter = allProducts;

    if (selectedCategory) {
      productsToFilter = productsToFilter.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      productsToFilter = productsToFilter.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredProducts(productsToFilter);
    setCurrentPage(1); // Reset to first page on filter change
  }, [selectedCategory, searchTerm, allProducts]);

  const handleSelectCategory = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  };

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg text-muted-foreground">טוען מוצרים...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary">קטלוג המוצרים שלנו</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          עיין במגוון מוצרי "כביסכל" האיכותיים והוסף לעגלה בקלות.
        </p>
      </header>
      
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full sm:w-auto">
          <Input 
            type="search" 
            placeholder="חפש מוצרים..." 
            className="pl-10" 
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      
      {categories.length > 0 && (
        <CategoryFilter 
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />
      )}

      {paginatedProducts.length > 0 ? (
         <>
            <ProductList products={paginatedProducts} />
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
         </>
      ): (
        <p className="text-center text-muted-foreground py-8">
          לא נמצאו מוצרים התואמים את בחירתך.
        </p>
      )}
    </div>
  );
}
