
'use client';
import { ProductForm } from '@/components/admin/product-form';
import { createProductService } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const { toast } = useToast();
  const router = useRouter();

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

  return (
    <>
      {/* Casting productData to any in ProductForm to avoid type conflicts for now, as ProductForm expects full Product for initialData */}
      <ProductForm onSubmitSuccess={(productData) => handleSubmitSuccess(productData as any)} />
    </>
  );
}
