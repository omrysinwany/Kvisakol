import { CustomerHeader } from '@/components/customer/customer-header';
import { Footer } from '@/components/shared/footer';
import { CartProvider } from '@/contexts/cart-context';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <CustomerHeader />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
