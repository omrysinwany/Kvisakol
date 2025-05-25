
'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCartIcon, PlusCircle, MinusCircle, Info } from 'lucide-react';
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
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toast } = useToast();
  const quantityInCart = getItemQuantity(product.id);
  const [inputValue, setInputValue] = useState(quantityInCart.toString());

  const pathname = usePathname();
  const isAdminPreview = pathname === '/admin/catalog-preview';

  useEffect(() => {
    setInputValue(quantityInCart.toString());
  }, [quantityInCart]);

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "מוצר נוסף לעגלה",
      description: `${product.name} נוסף לעגלת הקניות שלך.`,
      duration: 3000,
    });
  };

  const handleQuantityChangeViaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const newQuantity = quantityInCart + 1;
    updateQuantity(product.id, newQuantity);
    setInputValue(newQuantity.toString());
  };

  const handleDecreaseQuantity = () => {
    const newQuantity = quantityInCart - 1;
    updateQuantity(product.id, newQuantity);
    setInputValue(newQuantity > 0 ? newQuantity.toString() : "0");
  };
  
  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`;
  }

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0">
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
      <CardContent className="p-3 flex-1">
        <CardTitle className="text-primary text-sm mb-1 h-10 leading-tight overflow-hidden text-center line-clamp-2">
          {product.name}
        </CardTitle>
      </CardContent>
      <CardFooter className={cn(
        "p-3 flex items-center mt-auto",
        isAdminPreview ? "justify-start" : "flex-col sm:flex-row justify-between gap-1"
      )}>
        <div className="flex items-center gap-1">
          <p className="text-sm text-foreground">{formatPrice(product.price)}</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                <Info className="h-4 w-4" />
                <span className="sr-only">פרטים נוספים על {product.name}</span>
              </Button>
            </DialogTrigger>
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
        </div>
        
        {!isAdminPreview && (
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
  );
}
