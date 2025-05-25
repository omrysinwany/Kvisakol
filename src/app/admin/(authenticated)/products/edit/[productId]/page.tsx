
'use client'; 

import { ProductForm } from '@/components/admin/product-form';
import { getProductById, updateProductService, getAllProductsForAdmin } from '@/services/product-service';
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
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      const fetchProductAndCategories = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const [product, allProducts] = await Promise.all([
            getProductById(productId),
            getAllProductsForAdmin()
          ]);

          if (product) {
            setInitialData(product);
          } else {
            setError('מוצר לא נמצא.');
            toast({ variant: 'destructive', title: 'שגיאה', description: 'המוצר המבוקש לא נמצא.' });
            router.push('/admin/products');
            return; // Exit early if product not found
          }
          
          const uniqueCategories = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean) as string[])).sort();
          setAvailableCategories(uniqueCategories);

        } catch (err) {
          console.error("Failed to fetch product or categories:", err);
          setError('שגיאה בטעינת הנתונים.');
          toast({ variant: 'destructive', title: 'שגיאה', description: 'אירעה שגיאה בטעינת פרטי המוצר או הקטגוריות.' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchProductAndCategories();
    }
  }, [productId, router, toast]);

  const handleSubmitSuccess = async (updatedProductData: Product) => {
    try {
      const productToUpdate: Partial<Omit<Product, 'id'>> = {
        name: updatedProductData.name,
        description: updatedProductData.description,
        price: updatedProductData.price,
        category: updatedProductData.category,
        isActive: updatedProductData.isActive,
        imageUrl: updatedProductData.imageUrl,
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
    return <div className="container mx-auto px-4 py-8"><p>טוען פרטי מוצר וקטגוריות...</p></div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8"><p className="text-destructive">{error}</p></div>;
  }

  if (!initialData) {
    // This case should ideally be handled by the redirect in useEffect if product is not found
    return <div className="container mx-auto px-4 py-8"><p>לא ניתן לטעון את המוצר.</p></div>;
  }

  return (
    <>
      <ProductForm initialData={initialData} onSubmitSuccess={handleSubmitSuccess} availableCategories={availableCategories} />
    </>
  );
}

