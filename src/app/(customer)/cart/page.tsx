import { CartView } from '@/components/customer/cart-view';

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">עגלת הקניות שלך</h1>
      </header>
      <CartView />
    </div>
  );
}
