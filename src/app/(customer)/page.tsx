'use client';

import { ProductList } from '@/components/customer/product-list';
import { placeholderProducts } from '@/lib/placeholder-data';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { CategoryFilter } from '@/components/customer/category-filter';

// Function to get products (simulated)
async function getProducts(): Promise<Product[]> {
  // In a real app, fetch from your backend/Firebase
  return placeholderProducts.filter(p => p.isActive);
}

export default function CatalogPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const products = await getProducts();
      setAllProducts(products);
      setFilteredProducts(products);
      setIsLoading(false);
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
  }, [selectedCategory, searchTerm, allProducts]);

  const handleSelectCategory = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
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

      {filteredProducts.length > 0 ? (
         <ProductList products={filteredProducts} />
      ): (
        <p className="text-center text-muted-foreground py-8">
          לא נמצאו מוצרים התואמים את בחירתך.
        </p>
      )}
    </div>
  );
}
