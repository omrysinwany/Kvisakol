
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

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toast } = useToast();
  const quantityInCart = getItemQuantity(product.id);
  const [inputValue, setInputValue] = useState(quantityInCart.toString());

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
      // If input is cleared or set to 0, effectively remove from cart or set to 0.
      // updateQuantity handles newQuantity <= 0 by removing the item or preventing update
      updateQuantity(product.id, 0); 
    }
  };

  // This function ensures that if the user leaves the input field empty or with an invalid number,
  // it resets to the current quantity in cart or 0 if not in cart.
  const handleBlurInput = () => {
    const currentCartQty = getItemQuantity(product.id);
    if (inputValue === '' || isNaN(parseInt(inputValue, 10)) || parseInt(inputValue, 10) <= 0) {
      // If the item was in cart, reset input to its quantity, otherwise set to "0"
      // This also handles the case where user types "0" and it was already in cart.
      if (currentCartQty > 0) {
        setInputValue(currentCartQty.toString());
      } else {
        // If it wasn't in cart and input is invalid/empty/0, reflect "0"
        setInputValue("0"); 
      }
    }
    // If a valid number was entered, it's already handled by handleQuantityChangeViaInput
  };

  const handleIncreaseQuantity = () => {
    const newQuantity = quantityInCart + 1;
    updateQuantity(product.id, newQuantity);
    setInputValue(newQuantity.toString());
  };

  const handleDecreaseQuantity = () => {
    const newQuantity = quantityInCart - 1;
    updateQuantity(product.id, newQuantity); // updateQuantity will handle removal if newQuantity is 0 or less
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
            src={product.imageUrl || 'https://placehold.co/300x300.png'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            data-ai-hint={product.dataAiHint as string || 'product image'}
            onError={(e) => {
              // Fallback for broken images
              e.currentTarget.srcset = 'https://placehold.co/300x300.png';
              e.currentTarget.src = 'https://placehold.co/300x300.png';
            }}
          />
        </div>
      </CardHeader>
      <CardContent className="p-3 flex-1">
        <CardTitle className="text-sm font-semibold mb-1 h-10 leading-tight overflow-hidden text-primary">
          {product.name}
        </CardTitle>
        {product.category && <Badge variant="secondary" className="mb-1 text-xs">{product.category}</Badge>}
      </CardContent>
      <CardFooter className="p-2 flex flex-col sm:flex-row justify-between items-center gap-1 mt-auto">
        <p className="text-base font-bold">{formatPrice(product.price)}</p>
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
      </CardFooter>
    </Card>
  );
}
