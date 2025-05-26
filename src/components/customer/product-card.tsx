
'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCartIcon, PlusCircle, MinusCircle, InfoIcon } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  isAdminPreview?: boolean;
  isAdminGalleryView?: boolean;
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
    if (isAdminGalleryView || isAdminPreview) return;
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
  
  const openDialog = (e?: React.MouseEvent) => {
    if (isAdminGalleryView) return;
    if (e) e.stopPropagation();
    setIsDialogOpen(true);
  };

  const handleCardContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input[type="number"]')) {
      return;
    }
    if (!isAdminGalleryView) {
      openDialog(e);
    }
  };


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
            <Badge
              className={cn(
                "absolute top-2 left-2 z-10 text-xs px-1.5 py-0.5", 
                product.isActive ? "bg-green-500 text-white" : "bg-red-500 text-white"
              )}
            >
              {product.isActive ? "פעיל" : "לא פעיל"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pb-2 flex-1 flex flex-col justify-center">
          <CardTitle className="text-sm leading-normal text-center line-clamp-2 text-[hsl(var(--ring))]">
            {product.name}
          </CardTitle>
        </CardContent>
        <CardFooter className="p-0" /> 
      </Card>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Card 
        className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg h-full"
      >
        <CardHeader
          className="p-0 relative cursor-pointer"
          onClick={(e) => {
            if (!isAdminPreview && !isAdminGalleryView) openDialog(e);
          }}
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
                className="absolute top-2 left-2 z-10 text-xs px-1.5 py-0.5"
              >
                {product.category}
              </Badge>
            )}
             {(!isAdminPreview && !isAdminGalleryView) && (
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-primary hover:bg-background/70 z-10"
                  onClick={(e) => { e.stopPropagation(); setIsDialogOpen(true);}}
                  aria-label="פרטים נוספים"
                >
                  <InfoIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            )}
          </div>
        </CardHeader>
        <CardContent
          className="p-3 flex-1 pb-2"
          onClick={(e) => {
             if (!isAdminPreview && !isAdminGalleryView) handleCardContentClick(e);
          }}
        >
          <CardTitle 
            className={cn(
              "text-sm leading-normal text-center line-clamp-2 text-[hsl(var(--ring))]",
              (!isAdminPreview && !isAdminGalleryView) && "cursor-pointer"
            )}
          >
            {product.name}
          </CardTitle>
        </CardContent>
        <CardFooter
          className={cn(
            "p-3 flex mt-auto items-center", 
            isAdminPreview ? "justify-center" : "flex-col sm:flex-row justify-between gap-1"
          )}
          onClick={(e) => {
            if (!isAdminPreview && !isAdminGalleryView && e.target !== e.currentTarget && !targetIsDialogTrigger(e.target as HTMLElement) ) { 
                 e.stopPropagation();
            }
          }}
        >
          <div className={cn("flex items-center", isAdminPreview || isAdminGalleryView ? "justify-center w-full" : "gap-1")}>
            <p className="text-sm text-foreground font-semibold">{formatPrice(product.price)}</p>
          </div>

          {(!isAdminPreview && !isAdminGalleryView) && (
            <div className='flex items-center'> {/* Removed min-h-[36px] */}
              {quantityInCart === 0 ? (
                <Button onClick={(e) => { e.stopPropagation(); handleAddToCart(); }} className="w-full sm:w-auto" size="sm">
                  <ShoppingCartIcon className="ml-1.5 h-4 w-4" />
                  הוספה
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handleDecreaseQuantity(); }} className="h-7 w-7 rounded-full">
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={inputValue}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { e.stopPropagation(); handleQuantityChangeViaInput(e);}}
                    onBlur={(e) => { e.stopPropagation(); handleBlurInput();}}
                    className="h-7 w-10 text-center px-1 text-sm border-input focus:ring-primary focus:border-primary"
                    min="0"
                  />
                  <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handleIncreaseQuantity();}} className="h-7 w-7 rounded-full">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
      {(!isAdminPreview && !isAdminGalleryView) && (
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
      )}
    </Dialog>
  );
}

function targetIsDialogTrigger(target: HTMLElement | null): boolean {
  while (target) {
    if (target.getAttribute && target.getAttribute('data-radix-dialog-trigger') !== null) {
      return true;
    }
    target = target.parentElement;
  }
  return false;
}

    