'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCartIcon, PlusCircle, MinusCircle, CheckCircle } from 'lucide-react';
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
        <div className="aspect-[4/3] relative w-full">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={product.dataAiHint as string}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1">{product.name}</CardTitle>
        {product.category && <Badge variant="secondary" className="mb-2">{product.category}</Badge>}
        <CardDescription className="text-sm text-muted-foreground h-20 overflow-y-auto">
          {product.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-xl font-bold text-primary">{formatPrice(product.price)}</p>
        {quantityInCart === 0 ? (
          <Button onClick={handleAddToCart} className="w-full sm:w-auto">
            <ShoppingCartIcon className="ml-2 h-4 w-4" />
            הוספה לעגלה
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleDecreaseQuantity}>
              <MinusCircle className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-medium">{quantityInCart}</span>
            <Button variant="outline" size="icon" onClick={handleIncreaseQuantity}>
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
