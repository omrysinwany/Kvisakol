
'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCartIcon, PlusCircle, MinusCircle } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  isAdminPreview?: boolean; // For /admin/catalog-preview
  isAdminGalleryView?: boolean; // For admin products page gallery view
}

export function ProductCard({ product, isAdminPreview = false, isAdminGalleryView = false }: ProductCardProps) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toast } = useToast();
  const quantityInCart = getItemQuantity(product.id);
  const [inputValue, setInputValue] = useState(quantityInCart.toString());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setInputValue(quantityInCart.toString());
  }, [quantityInCart]);

  const handleAddToCart = () => {
    if (isAdminGalleryView || isAdminPreview) return; // Should not happen if controls are hidden
    addToCart(product);
    toast({
      title: "מוצר נוסף לעגלה",
      description: `${product.name} נוסף לעגלת הקניות שלך.`,
      duration: 3000,
    });
  };

  const handleQuantityChangeViaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAdminGalleryView || isAdminPreview) return;
    const value = e.target.value;
    setInputValue(value); 

    const newQuantity = parseInt(value, 10);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      updateQuantity(product.id, newQuantity);
    } else if (value === '' || newQuantity === 0) {
      updateQuantity(product.id, 0); 
    }
  };

  const handleBlurInput = () => {
    if (isAdminGalleryView || isAdminPreview) return;
    const currentCartQty = getItemQuantity(product.id);
    if (inputValue === '' || isNaN(parseInt(inputValue, 10)) || parseInt(inputValue, 10) <= 0) {
      if (currentCartQty > 0) {
        setInputValue(currentCartQty.toString());
      } else {
        setInputValue("0"); 
      }
    }
  };

  const handleIncreaseQuantity = () => {
    if (isAdminGalleryView || isAdminPreview) return;
    const newQuantity = quantityInCart + 1;
    updateQuantity(product.id, newQuantity);
    setInputValue(newQuantity.toString());
  };

  const handleDecreaseQuantity = () => {
    if (isAdminGalleryView || isAdminPreview) return;
    const newQuantity = quantityInCart - 1;
    updateQuantity(product.id, newQuantity);
    setInputValue(newQuantity > 0 ? newQuantity.toString() : "0");
  };
  
  const formatPrice = (price: number) => {
    return `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const openDialog = () => {
    if (isAdminGalleryView) return; // In admin gallery, clicking the card navigates to edit
    setIsDialogOpen(true);
  }

  // Admin Gallery View: Simplified card, no Dialog, no cart controls.
  // The parent Link in ProductGrid handles navigation to edit.
  if (isAdminGalleryView) {
    return (
      <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg h-full">
        <CardHeader className="p-0 relative">
          <div className="aspect-square relative w-full">
            <Image
              src={product.imageUrl || '/images/products/placeholder.jpg'}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              data-ai-hint={product.dataAiHint as string || 'product image'}
              onError={(e) => {
                e.currentTarget.srcset = '/images/products/placeholder.jpg';
                e.currentTarget.src = '/images/products/placeholder.jpg';
              }}
            />
            {product.category && (
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 z-10 text-xs" 
              >
                {product.category}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 pb-1 flex-1">
          <CardTitle className="text-sm h-10 leading-tight overflow-hidden text-center line-clamp-2">
            {product.name}
          </CardTitle>
        </CardContent>
        <CardFooter className="p-3 flex mt-auto justify-center items-center">
          <p className="text-sm font-semibold text-foreground">{formatPrice(product.price)}</p>
        </CardFooter>
      </Card>
    );
  }

  // Customer View or Admin Catalog Preview View
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg h-full">
        <CardHeader 
          className="p-0 relative cursor-pointer" 
          onClick={openDialog}
        >
          <div className="aspect-square relative w-full">
            <Image
              src={product.imageUrl || '/images/products/placeholder.jpg'}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              data-ai-hint={product.dataAiHint as string || 'product image'}
              onError={(e) => {
                e.currentTarget.srcset = '/images/products/placeholder.jpg';
                e.currentTarget.src = '/images/products/placeholder.jpg';
              }}
            />
            {product.category && (
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 z-10 text-xs" 
              >
                {product.category}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent 
          className="p-3 pb-1 flex-1 cursor-pointer"
          onClick={openDialog}
        >
          <CardTitle className="text-sm h-10 leading-tight overflow-hidden text-center line-clamp-2">
            {product.name}
          </CardTitle>
        </CardContent>
        <CardFooter 
          className={cn(
            "p-3 flex mt-auto",
            isAdminPreview ? "justify-center items-center" : "flex-col sm:flex-row justify-between items-center gap-1"
          )}
          onClick={(e) => e.stopPropagation()} 
        >
          <div className={cn("flex items-center", isAdminPreview ? "justify-center w-full" : "")}>
            <p className="text-sm font-semibold text-foreground">{formatPrice(product.price)}</p>
          </div>
          
          {!isAdminPreview && ( /* Cart controls only for customer view */
            <>
              {quantityInCart === 0 ? (
                <Button onClick={handleAddToCart} className="w-full sm:w-auto" size="sm">
                  <ShoppingCartIcon className="ml-1.5 h-4 w-4" />
                  הוספה
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={handleDecreaseQuantity} className="h-7 w-7 rounded-full">
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={handleQuantityChangeViaInput}
                    onBlur={handleBlurInput}
                    className="h-7 w-10 text-center px-1 text-sm border-border focus:ring-primary focus:border-primary"
                    min="0" 
                  />
                  <Button variant="outline" size="icon" onClick={handleIncreaseQuantity} className="h-7 w-7 rounded-full">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative aspect-square w-full max-w-xs mx-auto">
            <Image
              src={product.imageUrl || '/images/products/placeholder.jpg'}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 80vw, 320px"
              className="object-cover rounded-md"
              data-ai-hint={product.dataAiHint as string || 'product image'}
               onError={(e) => {
                  e.currentTarget.srcset = '/images/products/placeholder.jpg';
                  e.currentTarget.src = '/images/products/placeholder.jpg';
              }}
            />
             {product.category && (
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 z-10 text-xs" 
              >
                {product.category}
              </Badge>
            )}
          </div>
          <p className="text-xl font-semibold">{formatPrice(product.price)}</p>
          <DialogDescription className="text-sm text-muted-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto">
            {product.description}
          </DialogDescription>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              סגור
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
