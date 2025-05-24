'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCartIcon, PlusCircle, MinusCircle } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toast } = useToast();
  const quantityInCart = getItemQuantity(product.id);

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "מוצר נוסף לעגלה",
      description: `${product.name} נוסף לעגלת הקניות שלך.`,
      duration: 3000,
    });
  };

  const handleIncreaseQuantity = () => {
    updateQuantity(product.id, quantityInCart + 1);
  };

  const handleDecreaseQuantity = () => {
    updateQuantity(product.id, quantityInCart - 1);
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
        <CardTitle className="text-base font-semibold mb-1">{product.name}</CardTitle>
        {product.category && <Badge variant="secondary" className="mb-1 text-xs">{product.category}</Badge>}
      </CardContent>
      <CardFooter className="p-3 flex flex-col sm:flex-row justify-between items-center gap-1 mt-auto">
        <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>
        {quantityInCart === 0 ? (
          <Button onClick={handleAddToCart} className="w-full sm:w-auto" size="sm">
            <ShoppingCartIcon className="ml-1.5 h-4 w-4" />
            הוספה
          </Button>
        ) : (
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" onClick={handleDecreaseQuantity} className="h-7 w-7">
              <MinusCircle className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center font-medium text-sm">{quantityInCart}</span>
            <Button variant="outline" size="icon" onClick={handleIncreaseQuantity} className="h-7 w-7">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
