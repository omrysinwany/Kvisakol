
'use client';

import { ProductList } from '@/components/customer/product-list';
import { getProductsForCatalog } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEffect, useState, useMemo, useRef } from 'react';
import { CategoryFilter } from '@/components/customer/category-filter';
import { PaginationControls } from '@/components/customer/pagination-controls';

const ITEMS_PER_PAGE = 12;
const PRODUCT_ID_TO_MOVE_SECOND_LAST_NK = 'kbio1'; // ID for "כביסכל Bio אלגנס – 2 ליטר"
const PRODUCT_ID_TO_MOVE_VERY_LAST_NK = 'kbio11';  // ID for "כביסכל Bio רד רוז – 2 ליטר"
const TARGET_CATEGORY_FOR_RESORT_NK = 'נוזלי כביסה';

const PRODUCT_ID_TO_MOVE_LAST_PFF = 'kpff1'; // ID for "מבשם רצפות פרוביוטי מאסק פלאוורס"
const TARGET_CATEGORY_FOR_RESORT_PFF = 'פרפלור מבשמי רצפות';

const PRODUCT_ID_TO_MOVE_LAST_MNM = 'kprof7'; // ID for "מסיר כתמים לפני כביסה"
const TARGET_CATEGORY_FOR_RESORT_MNM = 'מוצרי ניקוי מקצועיים';

const TARGET_CATEGORY_MBSMM = 'מבשמים';
const ORDERED_PRODUCT_IDS_MBSMM = [
  'kmb7',  // בייבי 750 מ"ל ביו
  'kmb14', // מאסק פלאוורס 750 מ"ל
  'kmb1',  // מבשם אלגנס 750 מ"ל
  'kmb2',  // סופט קייר 750 מ"ל ביו
  'kmb6',  // ספא 750 מ"ל
  'kmb3',  // פרידום 750 מ"ל
  'kmb11', // רוז 750 מ"ל
];

// Updated list for "All" filter priority
const PRIORITY_ALL_FILTER_IDS = ['pkg5', 'pkg1', 'kbio2', 'kbio3'];


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
        // Initial set of filteredProducts will be handled by the other useEffect
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
    return Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b, 'he'));
  }, [allProducts]);

  useEffect(() => {
    let processedProducts = [...allProducts];

    if (selectedCategory === null && searchTerm === '') {
        // Special sorting for "All" view: prioritize specific items
        const prioritizedItems: Product[] = [];
        const otherItems: Product[] = [];

        processedProducts.forEach(p => {
            if (PRIORITY_ALL_FILTER_IDS.includes(p.id)) {
                prioritizedItems.push(p);
            } else {
                otherItems.push(p);
            }
        });

        // Sort prioritized items according to the order in PRIORITY_ALL_FILTER_IDS
        prioritizedItems.sort((a, b) => PRIORITY_ALL_FILTER_IDS.indexOf(a.id) - PRIORITY_ALL_FILTER_IDS.indexOf(b.id));
        
        // Sort other items alphabetically
        otherItems.sort((a,b) => a.name.localeCompare(b.name, 'he'));

        processedProducts = [...prioritizedItems, ...otherItems];
    } else {
        // Default sort for filtered views or views with search term
        processedProducts.sort((a,b) => a.name.localeCompare(b.name, 'he'));

        if (selectedCategory) {
            processedProducts = processedProducts.filter(p => p.category === selectedCategory);
        }

        if (searchTerm) {
            processedProducts = processedProducts.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        // Apply existing special category-specific re-sorting for *filtered* views
        if (selectedCategory === TARGET_CATEGORY_FOR_RESORT_NK) {
            let productSecondLast: Product | null = null;
            let productVeryLast: Product | null = null;
            const remainingProducts = processedProducts.filter(p => {
                if (p.id === PRODUCT_ID_TO_MOVE_SECOND_LAST_NK) { productSecondLast = p; return false; }
                if (p.id === PRODUCT_ID_TO_MOVE_VERY_LAST_NK) { productVeryLast = p; return false; }
                return true;
            });
            processedProducts = [...remainingProducts];
            if (productSecondLast) processedProducts.push(productSecondLast);
            if (productVeryLast) processedProducts.push(productVeryLast);
        } else if (selectedCategory === TARGET_CATEGORY_FOR_RESORT_PFF) {
            let productToMoveLast: Product | null = null;
            const remainingProducts = processedProducts.filter(p => {
                if (p.id === PRODUCT_ID_TO_MOVE_LAST_PFF) { productToMoveLast = p; return false; }
                return true;
            });
            processedProducts = [...remainingProducts];
            if (productToMoveLast) processedProducts.push(productToMoveLast);
        } else if (selectedCategory === TARGET_CATEGORY_MBSMM) {
            processedProducts.sort((a, b) => {
                const indexA = ORDERED_PRODUCT_IDS_MBSMM.indexOf(a.id);
                const indexB = ORDERED_PRODUCT_IDS_MBSMM.indexOf(b.id);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.name.localeCompare(b.name, 'he');
            });
        } else if (selectedCategory === TARGET_CATEGORY_FOR_RESORT_MNM) {
            let productToMoveLast: Product | null = null;
            const remainingProducts = processedProducts.filter(p => {
                if (p.id === PRODUCT_ID_TO_MOVE_LAST_MNM) { productToMoveLast = p; return false; }
                return true;
            });
            processedProducts = [...remainingProducts];
            if (productToMoveLast) processedProducts.push(productToMoveLast);
        }
    }
    
    setFilteredProducts(processedProducts);
    setCurrentPage(1); 

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

  // useEffect to set initial filteredProducts once allProducts are loaded
  useEffect(() => {
    if (allProducts.length > 0 && filteredProducts.length === 0 && selectedCategory === null && searchTerm === '') {
        // This block ensures that initial "All" view sorting is applied when products first load
        let initialProcessedProducts = [...allProducts];
        const prioritizedItems: Product[] = [];
        const otherItems: Product[] = [];

        initialProcessedProducts.forEach(p => {
            if (PRIORITY_ALL_FILTER_IDS.includes(p.id)) {
                prioritizedItems.push(p);
            } else {
                otherItems.push(p);
            }
        });
        prioritizedItems.sort((a, b) => PRIORITY_ALL_FILTER_IDS.indexOf(a.id) - PRIORITY_ALL_FILTER_IDS.indexOf(b.id));
        otherItems.sort((a,b) => a.name.localeCompare(b.name, 'he'));
        initialProcessedProducts = [...prioritizedItems, ...otherItems];
        setFilteredProducts(initialProcessedProducts);
    } else if (allProducts.length > 0 && selectedCategory === null && searchTerm === '' && filteredProducts.length === 0) {
      // Fallback for initial load if the above doesn't trigger due to timing
      setFilteredProducts([...allProducts].sort((a,b) => a.name.localeCompare(b.name, 'he')));
    }
  }, [allProducts, selectedCategory, searchTerm, filteredProducts.length]);


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
            {isLoading ? 'טוען מוצרים...' : 'לא נמצאו מוצרים התואמים את בחירתך.'}
          </p>
        )}
      </div>
    </div>
  );
}
