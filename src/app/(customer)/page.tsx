
'use client';

import { ProductList } from '@/components/customer/product-list';
import { getProductsForCatalog } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEffect, useState, useMemo, useRef } from 'react';
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
  const scrollTargetRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const products = await getProductsForCatalog();
        setAllProducts(products);
        setFilteredProducts(products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
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
    setCurrentPage(1); // Reset to first page on filter/search change

    // Scroll to target when category or search term changes
    // This check ensures we don't scroll on initial load if allProducts is still empty
    // and it's not a direct category/search interaction yet.
    // We only want to scroll if it's a user-driven filter/search change after initial load.
    if (scrollTargetRef.current && !isLoading) { // Added !isLoading to prevent scroll on initial fetch
      const headerHeight = 64; // Assuming CustomerHeader height is h-16 (4rem = 64px)
      
      const elementTopRelativeToDocument = scrollTargetRef.current.getBoundingClientRect().top + window.scrollY;
      const scrollToPosition = elementTopRelativeToDocument - headerHeight;

      window.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth',
      });
    }

  }, [selectedCategory, searchTerm, allProducts, isLoading]); // Added isLoading to dependency array

  const handleSelectCategory = (category: string | null) => {
    setSelectedCategory(category);
    // Scrolling is now handled by the useEffect above
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
     // Scrolling is now handled by the useEffect above
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (scrollTargetRef.current) {
      const headerHeight = 64; // Assuming CustomerHeader height is h-16 (4rem = 64px)
      
      const elementTopRelativeToDocument = scrollTargetRef.current.getBoundingClientRect().top + window.scrollY;
      const scrollToPosition = elementTopRelativeToDocument - headerHeight;

      window.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth',
      });
    }
  };

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  if (isLoading && allProducts.length === 0) { // Show loading only on initial full load
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
      
      <div ref={scrollTargetRef} className="mb-8"> 
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-6"> 
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
      </div>

      <div>
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
    </div>
  );
}
