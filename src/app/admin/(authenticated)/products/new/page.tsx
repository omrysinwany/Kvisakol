
'use client';
import { ProductForm } from '@/components/admin/product-form';
import { createProductService, getAllProductsForAdmin } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const products = await getAllProductsForAdmin();
        const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[])).sort();
        setAvailableCategories(uniqueCategories);
      } catch (error) {
        console.error("Failed to fetch categories for new product form:", error);
        toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לטעון את רשימת הקטגוריות." });
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [toast]);

  const handleSubmitSuccess = async (productData: Omit<Product, 'id' | 'dataAiHint'> & { imageUrl?: string}) => {
    try {
      const newProduct = await createProductService(productData);
      toast({
        title: 'מוצר נוצר!',
        description: `המוצר "${newProduct.name}" נוצר בהצלחה.`,
      });
      router.push('/admin/products');
    } catch (error) {
      console.error("Failed to create product:", error);
      toast({ variant: 'destructive', title: 'שגיאה', description: 'אירעה שגיאה ביצירת המוצר.' });
    }
  };

  if (isLoadingCategories) {
    return <div className="container mx-auto px-4 py-8"><p>טוען אפשרויות קטגוריה...</p></div>;
  }

  return (
    <>
      <ProductForm 
        onSubmitSuccess={(productData) => handleSubmitSuccess(productData as any)} 
        availableCategories={availableCategories} 
      />
    </>
  );
}

