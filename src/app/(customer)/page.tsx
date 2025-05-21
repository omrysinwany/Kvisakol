import { ProductList } from '@/components/customer/product-list';
import { placeholderProducts } from '@/lib/placeholder-data';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

// Server component to fetch products (simulated)
async function getProducts(): Promise<Product[]> {
  // In a real app, fetch from your backend/Firebase
  return placeholderProducts.filter(p => p.isActive);
}

export default async function CatalogPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary">קטלוג המוצרים שלנו</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          עיין במגוון מוצרי "כביסכל" האיכותיים והוסף לעגלה בקלות.
        </p>
      </header>
      
      {/* Placeholder for Search and Filter */}
      {/* <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Input type="search" placeholder="חפש מוצרים..." className="pl-10" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        {/* Add filter dropdowns here if needed e.g. by category */}
      {/*</div> */}

      <ProductList products={products} />
    </div>
  );
}
