
'use client'; 

import { ProductForm } from '@/components/admin/product-form';
import { getProductById, updateProductService } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const product = await getProductById(productId);
          if (product) {
            setInitialData(product);
          } else {
            setError('מוצר לא נמצא.');
            toast({ variant: 'destructive', title: 'שגיאה', description: 'המוצר המבוקש לא נמצא.' });
            router.push('/admin/products');
          }
        } catch (err) {
          console.error("Failed to fetch product:", err);
          setError('שגיאה בטעינת המוצר.');
          toast({ variant: 'destructive', title: 'שגיאה', description: 'אירעה שגיאה בטעינת המוצר.' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [productId, router, toast]);

  const handleSubmitSuccess = async (updatedProductData: Product) => {
    // The ProductForm might pass the full product object, but we only need to send changed fields ideally.
    // For simplicity with placeholder data, we'll pass essential fields for update.
    try {
      const productToUpdate: Partial<Omit<Product, 'id'>> = {
        name: updatedProductData.name,
        description: updatedProductData.description,
        price: updatedProductData.price,
        category: updatedProductData.category,
        isActive: updatedProductData.isActive,
        imageUrl: updatedProductData.imageUrl,
        // dataAiHint is usually not updated by form
      };
      const updatedProduct = await updateProductService(updatedProductData.id, productToUpdate);
      if (updatedProduct) {
        toast({
          title: 'מוצר עודכן!',
          description: `המוצר "${updatedProduct.name}" עודכן בהצלחה.`,
        });
        router.push('/admin/products');
      } else {
         toast({ variant: 'destructive', title: 'שגיאה', description: 'לא ניתן היה לעדכן את המוצר.' });
      }
    } catch (error) {
        console.error("Failed to update product:", error);
        toast({ variant: 'destructive', title: 'שגיאה', description: 'אירעה שגיאה בעדכון המוצר.' });
    }
  };
  
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען פרטי מוצר...</p></div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8"><p className="text-destructive">{error}</p></div>;
  }

  if (!initialData) {
    return <div className="container mx-auto px-4 py-8"><p>לא ניתן לטעון את המוצר.</p></div>;
  }

  return (
    <>
      <ProductForm initialData={initialData} onSubmitSuccess={handleSubmitSuccess} />
    </>
  );
}
