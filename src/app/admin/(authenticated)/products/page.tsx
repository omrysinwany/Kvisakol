'use client'; // Required for useState, useEffect, event handlers

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductTable } from '@/components/admin/product-table';
import { placeholderProducts } from '@/lib/placeholder-data';
import type { Product } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

// Simulate API calls or state management for product data
// In a real app, these would interact with Firebase/backend

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching products
    setProducts(placeholderProducts);
    setIsLoading(false);
  }, []);

  const handleDeleteProduct = (productId: string) => {
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    // Here you would also call your backend to delete the product
  };

  const handleToggleActive = (productId: string, isActive: boolean) => {
    setProducts(prevProducts => 
      prevProducts.map(p => p.id === productId ? { ...p, isActive } : p)
    );
    // Here you would also call your backend to update the product's active status
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
