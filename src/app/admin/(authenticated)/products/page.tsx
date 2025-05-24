
'use client'; 

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductTable } from '@/components/admin/product-table';
import { getAllProductsForAdmin, deleteProductService, toggleProductActiveStatusService } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const fetchedProducts = await getAllProductsForAdmin();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Failed to fetch products for admin:", error);
        toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לטעון את רשימת המוצרים."});
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [toast]);

  const handleDeleteProduct = async (productId: string, productName: string) => {
     if (window.confirm(`האם אתה בטוח שברצונך למחוק את המוצר "${productName}"?`)) {
        try {
            const success = await deleteProductService(productId);
            if (success) {
                setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
                toast({
                    title: "מוצר נמחק",
                    description: `המוצר "${productName}" נמחק בהצלחה.`,
                });
            } else {
                 toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה למחוק את המוצר."});
            }
        } catch (error) {
            console.error("Failed to delete product:", error);
            toast({ variant: "destructive", title: "שגיאה", description: "אירעה תקלה במחיקת המוצר."});
        }
     }
  };

  const handleToggleActive = async (productId: string, productName: string, currentIsActive: boolean) => {
    try {
        const updatedProduct = await toggleProductActiveStatusService(productId, !currentIsActive);
        if (updatedProduct) {
            setProducts(prevProducts => 
              prevProducts.map(p => p.id === productId ? { ...p, isActive: updatedProduct.isActive } : p)
            );
            toast({
                title: "סטטוס מוצר עודכן",
                description: `המוצר "${productName}" כעת ${updatedProduct.isActive ? "פעיל" : "לא פעיל"}.`,
            });
        } else {
            toast({ variant: "destructive", title: "שגיאה", description: "לא ניתן היה לעדכן את סטטוס המוצר."});
        }
    } catch (error) {
        console.error("Failed to toggle product active status:", error);
        toast({ variant: "destructive", title: "שגיאה", description: "אירעה תקלה בעדכון סטטוס המוצר."});
    }
  };
  
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><p>טוען מוצרים...</p></div>;
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול מוצרים</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <PlusCircle className="ml-2 h-4 w-4" />
            הוסף מוצר חדש
          </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>רשימת מוצרים</CardTitle>
          <CardDescription>
            כאן תוכל לנהל את כל המוצרים בקטלוג שלך. הוסף, ערוך ומחק מוצרים לפי הצורך.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <ProductTable products={products} onDeleteProduct={handleDeleteProduct} onToggleActive={handleToggleActive} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">לא נמצאו מוצרים. התחל על ידי הוספת מוצר חדש.</p>
              <Button asChild>
                <Link href="/admin/products/new">הוסף מוצר</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
