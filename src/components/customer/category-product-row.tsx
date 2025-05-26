
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
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-primary text-center">{categoryName}</h2>
      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pb-2">
        <div className="inline-flex whitespace-nowrap gap-4 py-2 px-1">
          {products.map((product) => (
            <div key={product.id} className="w-[170px] sm:w-[190px] flex-shrink-0 h-full"> {/* Adjusted width */}
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
