
'use client';

import CatalogPageContent from '@/app/(customer)/page';
import { CartProvider } from '@/contexts/cart-context';

// This page will render the customer-facing catalog within the admin layout.
// It needs its own CartProvider instance because ProductCard and other catalog components
// might rely on useCart hook. This cart context will be isolated to this admin preview.

export default function AdminCatalogPreviewPage() {
  return (
    <CartProvider>
      <div className="w-full">
        {/* The CatalogPageContent already has its own container and padding,
            so we don't need to add extra layout wrappers here unless specific adjustments are needed. */}
        <CatalogPageContent />
      </div>
    </CartProvider>
  );
}
