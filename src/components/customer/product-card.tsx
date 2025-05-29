
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
  DialogTrigger,
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

    // Add a full box quantity to the cart (Assuming 1 unit if unitsPerBox is not set or <= 0)
    addToCart(product, product.unitsPerBox && product.unitsPerBox > 0 ? product.unitsPerBox : 1);

    toast({
      title: "מוצר נוסף לעגלה",
      description: `ארגז ${product.name} נוסף לעגלת הקניות שלך.`,
      duration: 3000,
    });
  };

  const handleQuantityChangeViaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAdminGalleryView || isAdminPreview) return;
    const value = e.target.value;
    // Allow empty string temporarily for typing
    setInputValue(value);

    // Convert input value (number of boxes) to total units
    const numBoxes = parseInt(value, 10) || 0; // Default to 0 if input is not a valid number

    // Ensure unitsPerBox is a valid number before multiplying
    const effectiveUnitsPerBox = (product.unitsPerBox && product.unitsPerBox > 0) ? product.unitsPerBox : 1;
    const newTotalUnits = numBoxes * effectiveUnitsPerBox;

    // Update the cart with the new total units (ensure it's not negative)
    updateQuantity(product.id, Math.max(0, newTotalUnits));
  };

  const handleBlurInput = () => {
    if (isAdminGalleryView || isAdminPreview || !product.unitsPerBox || product.unitsPerBox <= 0) return;

    const currentCartQty = getItemQuantity(product.id);
    const currentBoxes = Math.floor(currentCartQty / product.unitsPerBox);

    if (isNaN(parseInt(inputValue, 10)) || parseInt(inputValue, 10) < 0) { // Check for non-numeric or negative input
      // If invalid input, revert to current number of boxes in cart
      setInputValue(currentBoxes.toString());
    } else {
       // If valid input, set the input value to the integer number of boxes
       setInputValue(parseInt(inputValue, 10).toString());
    }
  };

  const handleIncreaseQuantity = () => {
    if (isAdminGalleryView || isAdminPreview || !product.unitsPerBox || product.unitsPerBox <= 0) return;
    // Increase quantity by the number of units in a box
    const newTotalUnits = quantityInCart + product.unitsPerBox;
    updateQuantity(product.id, newTotalUnits);
  };

  const handleDecreaseQuantity = () => {
    if (isAdminGalleryView || isAdminPreview || !product.unitsPerBox || product.unitsPerBox <= 0) return;
    // Decrease quantity by the number of units in a box, ensuring it doesn't go below zero
    const newTotalUnits = Math.max(0, quantityInCart - product.unitsPerBox);
    updateQuantity(product.id, newTotalUnits);
  };

  const formatPrice = (price: number) => {
    return `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  const openDialog = (e?: React.MouseEvent) => {
    if (isAdminPreview || isAdminGalleryView) return;
    if (e) e.stopPropagation();
    setIsDialogOpen(true);
  };
  
  const handleCardContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input[type="number"]')) {
      return;
    }
    if (!isAdminPreview && !isAdminGalleryView) {
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
        <CardContent className="p-3 flex-1 flex flex-col justify-center">
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
            {product.unitsPerBox > 0 && !isAdminGalleryView && (
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 z-10 text-xs px-1.5 py-0.5"
              >
                {product.unitsPerBox} יח'
              </Badge>
            )}
            {isAdminGalleryView && (
              <Badge
                className={cn(
                  "absolute top-2 left-2 z-10 text-xs px-1.5 py-0.5", 
                  product.isActive ? "bg-green-500 text-white" : "bg-red-500 text-white"
                )}
              >
                {product.isActive ? "פעיל" : "לא פעיל"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent
          className="p-3 pb-1 min-h-[40px]"
          onClick={(e) => {
            if (!isAdminPreview && !isAdminGalleryView) handleCardContentClick(e);
          }}

        >
          {/* whitespace-normal-override is to counteract default white-space: nowrap styles from the CardTitle component */}
          <CardTitle 
            className={cn(
              "text-sm leading-normal text-center text-[hsl(var(--ring))] flex flex-col items-center", // Add flex and items-center
              (!isAdminPreview && !isAdminGalleryView) && "cursor-pointer"
            )}
            // dangerouslySetInnerHTML={{ __html: product.name }} // Removed dangerouslySetInnerHTML
          >  
            {product.name}
          </CardTitle>
        </CardContent>

        <CardFooter
          className={cn(
            "pt-1 px-3 pb-2 flex flex-col items-center mt-auto",
            (isAdminPreview || isAdminGalleryView) && "justify-center w-full"
          )}
          onClick={(e) => {
            if (!isAdminPreview && !isAdminGalleryView && e.target !== e.currentTarget) {
              e.stopPropagation();
            }
          }}
        >
          {/* עוטפים את שתי שורות המחיר כדי שלא יהיה רווח ביניהן */}
          <div className="flex flex-col items-center gap-0 text-center"> {/* Added text-center for better alignment */}
            <p className="text-xs text-muted-foreground font-normal">
              ({formatPrice(product.price)} ליחידה)
            </p>
          </div>

          {(!isAdminPreview && !isAdminGalleryView) && (
            <div className="flex items-center">
              {quantityInCart === 0 ? (
                <Button
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
                  className="w-full sm:w-auto text-white bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <ShoppingCartIcon className="ml-1.5 h-4 w-4" />
                  הוספה
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); handleDecreaseQuantity(); }}
                    className="h-7 w-7 rounded-full"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={inputValue}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { e.stopPropagation(); handleQuantityChangeViaInput(e); }}
                    onBlur={(e) => { e.stopPropagation(); handleBlurInput(); }}
                    className="h-7 w-12 text-center px-1 text-sm border-input focus:ring-primary focus:border-primary"
                    min="0"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); handleIncreaseQuantity(); }}
                    className="h-7 w-7 rounded-full"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardFooter>
      </Card>

      {(!isAdminPreview && !isAdminGalleryView) && (
        <DialogContent className="w-screen max-w-full max-h-screen
         sm:max-w-[525px] sm:max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[hsl(var(--ring))]">
              {product.name}
            </DialogTitle>
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
              {product.unitsPerBox > 0 && !isAdminGalleryView && (
                <Badge
                  variant="secondary"
                  className="absolute top-2 left-2 z-10 text-xs px-1.5 py-0.5"
                >
                  {product.unitsPerBox} יח'
                </Badge>
              )}
            </div>

            <div>
              <p className="text-xl font-semibold">
                {formatPrice(product.price * (product.unitsPerBox || 1))}
              </p>
              <p className="text-xs text-muted-foreground font-normal">
                ({formatPrice(product.price)} ליחידה)
              </p>
            </div>

            <DialogDescription className="text-sm text-muted-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {product.description}
            </DialogDescription>

            {/* מחיר מומלץ לצרכן מתחת לתיאור */}
            {product.consumerPrice != null && (
              <div className="mt-2 flex items-center gap-1">
                <p className="text-sm text-muted-foreground font-normal">
                  מחיר מומלץ לצרכן:
                </p>
                <p className="text-sm text-muted-foreground font-normal">
                  {formatPrice(product.consumerPrice)}
                </p>
              </div>
            )}
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

