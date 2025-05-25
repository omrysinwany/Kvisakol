
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
const PRODUCT_ID_TO_MOVE_LAST = 'kbio1'; // ID for "כביסכל Bio אלגנס – 2 ליטר"
const TARGET_CATEGORY_FOR_RESORT = 'נוזלי כביסה';

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
        setFilteredProducts(products); // Initialize with all products
      } catch (error) {
        console.error("Failed to fetch products:", error);
        // Optionally, set an error state here to display to the user
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
    let productsToFilter = [...allProducts]; // Start with a copy of all products

    if (selectedCategory) {
      productsToFilter = productsToFilter.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      productsToFilter = productsToFilter.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Custom sort: if the target category is selected, move the specific product to the end
    if (selectedCategory === TARGET_CATEGORY_FOR_RESORT) {
      const targetProductIndex = productsToFilter.findIndex(p => p.id === PRODUCT_ID_TO_MOVE_LAST);
      if (targetProductIndex > -1) {
        const [targetProduct] = productsToFilter.splice(targetProductIndex, 1);
        productsToFilter.push(targetProduct);
      }
    }
    
    setFilteredProducts(productsToFilter);
    setCurrentPage(1); // Reset to first page on filter/search change

    if (scrollTargetRef.current && !isLoading && (selectedCategory !== null || searchTerm !== '')) {
      const headerHeight = 64; 
      const elementTopRelativeToDocument = scrollTargetRef.current.getBoundingClientRect().top + window.scrollY;
      const scrollToPosition = elementTopRelativeToDocument - headerHeight;
      window.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth',
      });
    }

  }, [selectedCategory, searchTerm, allProducts, isLoading]);

  const handleSelectCategory = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (scrollTargetRef.current) {
      const headerHeight = 64; 
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
  
  if (isLoading && allProducts.length === 0) { 
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
          עיין במגוון מוצרי "כביסכל" והוסף לעגלה בקלות.
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
