// src/components/customer/category-product-row.tsx
'use client';

import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

interface CategoryProductRowProps {
  categoryName: string;
  products: Product[];
}

export function CategoryProductRow({ categoryName, products }: CategoryProductRowProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight text-primary text-center mb-2">{categoryName}</h2>
      <div className="mx-auto h-1 w-16 bg-primary/50 rounded-full mb-6"></div>
      <div className="w-full overflow-x-auto scrollbar-h-2.5 scrollbar-thumb-primary scrollbar-track-muted/40 pb-2">
        <div className="inline-flex gap-4 py-2 px-1">
          {products.map((product) => (
            <div key={product.id} className="w-[180px] sm:w-[200px] flex-shrink-0"> {/* Updated width here */}
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
