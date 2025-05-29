
'use client';

import { getProductsForCatalog } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEffect, useState, useMemo, useRef } from 'react';
import { CategoryProductRow } from '@/components/customer/category-product-row';
import { Separator } from '@/components/ui/separator'; // Added Separator import

const PRODUCT_ID_TO_MOVE_SECOND_LAST_NK = 'kbio1'; 
const PRODUCT_ID_TO_MOVE_VERY_LAST_NK = 'kbio11';  
const TARGET_CATEGORY_FOR_RESORT_NK = 'נוזלי כביסה';

const PRODUCT_ID_TO_MOVE_LAST_PFF = 'kpff1'; 
const TARGET_CATEGORY_FOR_RESORT_PFF = 'פרפלור מבשמי רצפות';

const PRODUCT_ID_TO_MOVE_LAST_MNM = 'kprof7'; 
const TARGET_CATEGORY_FOR_RESORT_MNM = 'מוצרי ניקוי מקצועיים';

const TARGET_CATEGORY_MBSMM = 'מבשמים';
const ORDERED_PRODUCT_IDS_MBSMM = [
  'kmb14', 
  'kmb1',  
  'kmb7',  
  'kmb2',  
  'kmb6',  
  'kmb3',  
  'kmb11', 
];

const PRIORITY_ALL_FILTER_IDS = ['pkg5', 'pkg1', 'kbio2', 'kbio3'];

// Define a preferred order for categories
const preferredOrder = [
  'מבשמים',
  'נוזלי כביסה',
  'פרפלור מבשמי רצפות',
  'נוזלי כלים',
  'מגבונים',
  'מפיצי ריח',
  'מוצרי ניקוי מקצועיים'
];

export default function CatalogPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categorizedProducts, setCategorizedProducts] = useState<{ categoryName: string; products: Product[] }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null); // Add new state
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const products = await getProductsForCatalog(); 
      setFetchError(null); // Clear previous errors
        setAllProducts(products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      setFetchError(error as Error); // Set the error state
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    console.log("🔍 env check:", {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }, []);

  useEffect(() => {
    if (isLoading && allProducts.length === 0) return; 

    let activeProducts = allProducts.filter(p => p.isActive);

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      activeProducts = activeProducts.filter(p =>
        p.name.toLowerCase().includes(lowerSearchTerm) ||
        (p.description && p.description.toLowerCase().includes(lowerSearchTerm))
      );
    }

    activeProducts = activeProducts.filter(p => p.category !== 'חבילות');

    const grouped: Record<string, Product[]> = {};
    for (const product of activeProducts) {
      const category = product.category || 'מוצרים ללא קטגוריה'; 
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    }
    
    const allCategoryNames = Object.keys(grouped);

    let sortedCategoryNames = allCategoryNames.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a);
      const bIndex = preferredOrder.indexOf(b);

      if (aIndex > -1 && bIndex > -1) {
        return aIndex - bIndex;
      }
      if (aIndex > -1) {
        return -1;
      }
      if (bIndex > -1) {
        return 1;
      }
      return a.localeCompare(b, 'he');
    });
    
    const finalCategorizedProducts: { categoryName: string; products: Product[] }[] = [];

    for (const categoryName of sortedCategoryNames) {
      let productsInCategory = [...grouped[categoryName]];

      if (categoryName === TARGET_CATEGORY_FOR_RESORT_NK) {
        let productSecondLast: Product | null = null;
        let productVeryLast: Product | null = null;
        const remainingForNK = productsInCategory.filter(p => {
            if (p.id === PRODUCT_ID_TO_MOVE_SECOND_LAST_NK) { productSecondLast = p; return false; }
            if (p.id === PRODUCT_ID_TO_MOVE_VERY_LAST_NK) { productVeryLast = p; return false; }
            return true;
        });
        productsInCategory = [...remainingForNK];
        if (productSecondLast) productsInCategory.push(productSecondLast);
        if (productVeryLast) productsInCategory.push(productVeryLast);
      } else if (categoryName === TARGET_CATEGORY_FOR_RESORT_PFF) {
        let productToMoveLast: Product | null = null;
        const remainingForPFF = productsInCategory.filter(p => {
            if (p.id === PRODUCT_ID_TO_MOVE_LAST_PFF) { productToMoveLast = p; return false; }
            return true;
        });
        productsInCategory = [...remainingForPFF];
        if (productToMoveLast) productsInCategory.push(productToMoveLast);
      } else if (categoryName === TARGET_CATEGORY_MBSMM) {
        productsInCategory.sort((a, b) => {
            const indexA = ORDERED_PRODUCT_IDS_MBSMM.indexOf(a.id);
            const indexB = ORDERED_PRODUCT_IDS_MBSMM.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(b.name, 'he');
        });
      } else if (categoryName === TARGET_CATEGORY_FOR_RESORT_MNM) {
        let productToMoveLast: Product | null = null;
        const remainingForMNM = productsInCategory.filter(p => {
            if (p.id === PRODUCT_ID_TO_MOVE_LAST_MNM) { productToMoveLast = p; return false; }
            return true;
        });
        productsInCategory = [...remainingForMNM];
        if (productToMoveLast) productsInCategory.push(productToMoveLast);
      }

      if (productsInCategory.length > 0) {
        finalCategorizedProducts.push({ categoryName, products: productsInCategory });
      }
    }
    
    // If no search term, apply priority sorting for "All" view
    if (!searchTerm) {
      const priorityProducts: { categoryName: string; products: Product[] }[] = [];
      const nonPriorityProducts: { categoryName: string; products: Product[] }[] = [];

      finalCategorizedProducts.forEach(catGroup => {
        const priorityInGroup = catGroup.products.filter(p => PRIORITY_ALL_FILTER_IDS.includes(p.id));
        const nonPriorityInGroup = catGroup.products.filter(p => !PRIORITY_ALL_FILTER_IDS.includes(p.id));

        // This logic needs refinement if we want to "pull out" priority products to the very top
        // For now, we keep them within their categories but reorder categories based on priority products.
        // A simpler approach for "All" view would be to have one flat list and sort it.
        // Given the current structure of CategoryProductRow, we will sort the categories themselves.
        
        // For simplicity with the current row-based structure, this complex priority sort is hard.
        // The previous PRIORITY_ALL_FILTER_IDS logic was for a flat list.
        // We will stick to alphabetical category sort for now, and special in-category sorts.
        // TODO: Revisit "All" view priority if a flat list is desired.
      });
       setCategorizedProducts(finalCategorizedProducts);

    } else {
      setCategorizedProducts(finalCategorizedProducts);
    }


  }, [allProducts, searchTerm, isLoading, preferredOrder]);


  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
     if (scrollTargetRef.current && (event.target.value !== '')) {
      const headerOffset = 70; // Approximate height of a sticky header
      const elementPosition = scrollTargetRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };
  
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
        {/* Optionally display an error message if fetching failed */}
        {fetchError && (
            <p className="mt-2 text-lg text-destructive">
                אירעה שגיאה בטעינת המוצרים. אנא נסה שוב מאוחר יותר.
                {/* Optionally display error details in development */}
                {process.env.NODE_ENV === 'development' && <span className="block text-sm">{fetchError.message}</span>}
            </p>
        )}
        <p className="mt-2 text-lg text-muted-foreground">
          עיין במגוון מוצרי "כביסכל" והוסף לעגלה בקלות.
        </p>

      </header>
      
      <div ref={scrollTargetRef} className="mb-8 sticky top-16 bg-background/90 backdrop-blur-sm z-40 py-4 -mx-4 px-4 shadow-sm"> 
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-0"> 
          <div className="relative flex-grow w-full">
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
      </div>

      <div className="space-y-6">
        {categorizedProducts.length > 0 ? (
           categorizedProducts.map(({ categoryName, products }, index) => (
             <div key={categoryName}>
               <CategoryProductRow categoryName={categoryName} products={products} />
               {index < categorizedProducts.length - 1 && (
                 <Separator className="my-10" /> // Add separator between categories
               )}
             </div>
           ))
        ): (
          <p className="text-center text-muted-foreground py-8">
            {isLoading ? 'טוען מוצרים...' : 'לא נמצאו מוצרים התואמים את בחירתך.'}
          </p>
        )}
      </div>
    </div>
  );
}
