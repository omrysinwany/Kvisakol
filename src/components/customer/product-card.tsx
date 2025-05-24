
'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCartIcon, PlusCircle, MinusCircle } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input'; // Import Input component
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
    setInputValue(value); // Update input field immediately

    const newQuantity = parseInt(value, 10);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      updateQuantity(product.id, newQuantity);
    } else if (value === '' || newQuantity === 0) {
      // If input is cleared or 0, treat as removing (or handle as min 1 if preferred)
      // For now, let's allow it to go to 0 and then get removed by updateQuantity logic
      updateQuantity(product.id, 0); 
    }
  };

  const handleBlurInput = () => {
    // If input is empty or invalid on blur, reset to actual cart quantity or 1 if not in cart
    const currentCartQty = getItemQuantity(product.id);
    if (inputValue === '' || isNaN(parseInt(inputValue, 10)) || parseInt(inputValue, 10) <= 0) {
      if (currentCartQty > 0) {
        setInputValue(currentCartQty.toString());
      } else {
        // If it was not in cart or quantity was 0, and input is invalid,
        // we might want to reset to 0 or 1 depending on desired behavior.
        // For now, if it was 0, it will stay as "0" in inputValue or be handled by addToCart
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
    updateQuantity(product.id, newQuantity); // updateQuantity handles removal if newQuantity <= 0
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
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            data-ai-hint={product.dataAiHint as string}
          />
        </div>
      </CardHeader>
      <CardContent className="p-3 flex-grow">
        <CardTitle className="text-sm font-semibold mb-1 h-10 leading-tight overflow-hidden">
          {product.name}
        </CardTitle>
        {product.category && <Badge variant="secondary" className="mb-1 text-xs">{product.category}</Badge>}
      </CardContent>
      <CardFooter className="p-2 flex flex-col sm:flex-row justify-between items-center gap-1 mt-auto">
        <p className="text-base font-bold text-primary">{formatPrice(product.price)}</p>
        {quantityInCart === 0 ? (
          <Button onClick={handleAddToCart} className="w-full sm:w-auto" size="sm">
            <ShoppingCartIcon className="ml-1.5 h-4 w-4" />
            הוספה
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handleDecreaseQuantity} className="h-7 w-7">
              <MinusCircle className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={inputValue}
              onChange={handleQuantityChangeViaInput}
              onBlur={handleBlurInput}
              className="h-7 w-10 text-center px-1 text-sm"
              min="0" // Allow 0 to effectively remove, or set to 1 to enforce min quantity
            />
            <Button variant="outline" size="icon" onClick={handleIncreaseQuantity} className="h-7 w-7">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
