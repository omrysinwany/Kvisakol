import { OrderForm } from '@/components/customer/order-form';

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">סיום הזמנה</h1>
        <p className="text-muted-foreground mt-1">אנא מלא את פרטיך להשלמת ההזמנה. הסוכן ייצור עמך קשר בהקדם.</p>
      </header>
      <OrderForm />
    </div>
  );
}
