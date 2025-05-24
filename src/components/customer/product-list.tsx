import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return <p className="text-center text-muted-foreground py-8">לא נמצאו מוצרים.</p>;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
