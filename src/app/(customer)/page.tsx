
'use client';

import { ProductList } from '@/components/customer/product-list'; // Will be removed or CategoryProductRow will use ProductCard directly
import { getProductsForCatalog } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { CategoryProductRow } from '@/components/customer/category-product-row'; // New component

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

// Products to show first when "All" (no category selected, no search)
const PRIORITY_ALL_FILTER_IDS = ['pkg5', 'pkg1', 'kbio2', 'kbio3'];


export default function CatalogPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categorizedProducts, setCategorizedProducts] = useState<{ categoryName: string; products: Product[] }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const products = await getProductsForCatalog(); 
        setAllProducts(products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isLoading && allProducts.length === 0) return; // Don't process if still loading initial products or if allProducts is empty

    let activeProducts = allProducts.filter(p => p.isActive);

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      activeProducts = activeProducts.filter(p =>
        p.name.toLowerCase().includes(lowerSearchTerm) ||
        (p.description && p.description.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Group products by category
    const grouped: Record<string, Product[]> = {};
    for (const product of activeProducts) {
      const category = product.category || 'מוצרים ללא קטגוריה'; // Default category for uncategorized products
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    }
    
    // Sort category names alphabetically (Hebrew)
    const sortedCategoryNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'he'));
    
    const finalCategorizedProducts: { categoryName: string; products: Product[] }[] = [];

    for (const categoryName of sortedCategoryNames) {
      // Products within grouped[categoryName] are already sorted by name from getProductsForCatalog
      // If search was applied, they should retain relative order or be re-sorted if necessary.
      // For simplicity, we rely on the initial sort and filtering preserving relative order.
      // If more complex search reordering happens, explicit sort by name here would be needed.
      let productsInCategory = [...grouped[categoryName]];

      // Apply special sorting rules
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
    
    setCategorizedProducts(finalCategorizedProducts);

  }, [allProducts, searchTerm, isLoading]);


  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
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
        <p className="mt-2 text-lg text-muted-foreground">
          עיין במגוון מוצרי "כביסכל" והוסף לעגלה בקלות.
        </p>
      </header>
      
      <div className="mb-8"> 
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
      </div>

      <div>
        {categorizedProducts.length > 0 ? (
           categorizedProducts.map(({ categoryName, products }) => (
             <CategoryProductRow key={categoryName} categoryName={categoryName} products={products} />
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
