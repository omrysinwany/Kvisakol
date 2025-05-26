
// src/components/admin/product-grid.tsx
'use client';

import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/customer/product-card'; // Reusing customer product card
import Link from 'next/link';

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return <p className="text-center text-muted-foreground py-8">לא נמצאו מוצרים.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <Link key={product.id} href={`/admin/products/edit/${product.id}`} className="block">
          <ProductCard product={product} isAdminPreview={true} />
        </Link>
      ))}
    </div>
  );
}
