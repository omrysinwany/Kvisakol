
'use client';

import Image from 'next/image';
import type { CartItem as CartItemType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { XIcon, PlusIcon, MinusIcon } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import Link from 'next/link';

interface CartItemProps {
  item: CartItemType;
}

export function CartItemCard({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(item.id, newQuantity);
  };

  const handleRemove = () => {
    removeFromCart(item.id);
  };
  
  const formatPrice = (price: number) => {
    return `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0 rounded-lg bg-card shadow-sm">
      <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-md">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 80px, 96px"
          className="object-cover"
          data-ai-hint={item.dataAiHint as string}
        />
      </div>
      <div className="flex-grow">
        <Link href={`/#${item.id}`} legacyBehavior>
          <a className="text-lg font-semibold hover:text-primary transition-colors">{item.name}</a>
        </Link>
        <p className="text-sm text-muted-foreground">{formatPrice(item.price)} ליחידה</p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <MinusIcon className="h-4 w-4" />
            <span className="sr-only">הפחת כמות</span>
          </Button>
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
            className="h-8 w-14 text-center"
            aria-label="כמות"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleQuantityChange(item.quantity + 1)}
          >
            <PlusIcon className="h-4 w-4" />
            <span className="sr-only">הוסף כמות</span>
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className="text-lg font-semibold">{formatPrice(item.price * item.quantity)}</p>
        <Button variant="ghost" size="icon" onClick={handleRemove} className="text-destructive hover:text-destructive">
          <XIcon className="h-5 w-5" />
          <span className="sr-only">הסר פריט</span>
        </Button>
      </div>
    </div>
  );
}
