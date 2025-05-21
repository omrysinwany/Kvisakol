'use client'; // Required for useParams

import { ProductForm } from '@/components/admin/product-form';
import { placeholderProducts } from '@/lib/placeholder-data';
import type { Product } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation'; // Changed from 'next/navigation'
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Simulate fetching a product by ID
async function getProductById(productId: string): Promise<Product | null> {
  return placeholderProducts.find(p => p.id === productId) || null;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = params.productId as string;
  const [initialData, setInitialData] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      getProductById(productId)
        .then(product => {
          if (product) {
            setInitialData(product);
          } else {
            setError('מוצר לא נמצא.');
            toast({ variant: 'destructive', title: 'שגיאה', description: 'המוצר המבוקש לא נמצא.' });
            router.push('/admin/products');
          }
        })
        .catch(err => {
          console.error("Failed to fetch product:", err);
          setError('שגיאה בטעינת המוצר.');
          toast({ variant: 'destructive', title: 'שגיאה', description: 'אירעה שגיאה בטעינת המוצר.' });
        })
        .finally(() => setIsLoading(false));
    }
  }, [productId, router, toast]);

  const handleSubmitSuccess = (product: Product) => {
    console.log("Product updated (client-side simulation):", product);
    // In a real app, this would call a server action to update in Firebase.
    // Navigation is handled inside ProductForm or here if needed.
    toast({
      title: 'מוצר עודכן!',
      description: `המוצר "${product.name}" עודכן בהצלחה.`,
    });
    router.push('/admin/products');
  };
  
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען פרטי מוצר...</p></div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8"><p className="text-destructive">{error}</p></div>;
  }

  if (!initialData) {
     // Should be caught by error state, but as a fallback
    return <div className="container mx-auto px-4 py-8"><p>לא ניתן לטעון את המוצר.</p></div>;
  }

  return (
    <>
      <ProductForm initialData={initialData} onSubmitSuccess={handleSubmitSuccess} />
    </>
  );
}
