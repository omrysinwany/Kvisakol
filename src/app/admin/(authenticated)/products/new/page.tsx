import { ProductForm } from '@/components/admin/product-form';

export default function NewProductPage() {
  // In a real app, onSubmitSuccess would likely call a server action
  // to create the product in Firebase.
  const handleSubmitSuccess = (product: any) => {
    console.log("Product created (client-side simulation):", product);
    // Navigation is handled inside ProductForm for this example
  };

  return (
    <>
      <ProductForm onSubmitSuccess={handleSubmitSuccess}/>
    </>
  );
}
