'use client';

import Image from 'next/image';
import type { CartItem as CartItemType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { XIcon, PlusIcon, MinusIcon } from 'lucide-react'; // Assuming MinusIcon and PlusIcon are used for quantity control
import { useCart } from '@/contexts/cart-context';
import Link from 'next/link';
import { useState, useEffect } from 'react'; // Import useState and useEffect

interface CartItemProps {
  item: CartItemType;
}

export function CartItemCard({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  // State to manage the input field value
  const [inputValue, setInputValue] = useState(item.quantity.toString());

  // Effect to update input value if item.quantity changes externally
  useEffect(() => {
    setInputValue(item.quantity.toString());
  }, [item.quantity]);


  const handleQuantityChange = (newQuantity: number) => {
    const unitsPerBox = item.unitsPerBox > 0 ? item.unitsPerBox : 1; // Prevent division by zero
    // Ensure the new quantity is a multiple of unitsPerBox and at least unitsPerBox (one box)
    const validQuantity = Math.max(unitsPerBox, Math.round(newQuantity / unitsPerBox) * unitsPerBox);

    if (validQuantity !== item.quantity) {
        updateQuantity(item.id, validQuantity);
        // Update input value when cart quantity changes
        setInputValue(validQuantity.toString());
    }
  };


  const handleDecreaseQuantity = () => {
      const unitsPerBox = item.unitsPerBox > 0 ? item.unitsPerBox : 1;
      const newQuantity = Math.max(unitsPerBox, item.quantity - unitsPerBox);
       if (newQuantity !== item.quantity) {
           updateQuantity(item.id, newQuantity);
            setInputValue(newQuantity.toString());
       }
  };

  const handleIncreaseQuantity = () => {
      const unitsPerBox = item.unitsPerBox > 0 ? item.unitsPerBox : 1;
      const newQuantity = item.quantity + unitsPerBox;
      updateQuantity(item.id, newQuantity);
       setInputValue(newQuantity.toString());
  };

  const handleQuantityChangeViaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Allow empty input or input ending with digits for better typing experience
       if (value === '' || /^\d+$/.test(value)) {
         setInputValue(value); // Update input value immediately
       }
       // Validation and actual quantity update will happen on blur
  };

   const handleBlurInput = () => {
      const unitsPerBox = item.unitsPerBox > 0 ? item.unitsPerBox : 1; // Prevent division by zero
      const parsedValue = parseInt(inputValue, 10);

       // Check if the parsed value is not a number or is less than the minimum allowed quantity
       if (isNaN(parsedValue) || parsedValue < unitsPerBox) {
           setInputValue(item.quantity.toString());
           return;
       }

      // Calculate the closest valid quantity (multiple of unitsPerBox)
      let newQuantity = Math.max(unitsPerBox, Math.round(parsedValue / unitsPerBox) * unitsPerBox);

       // If the calculated new quantity is different from the current quantity, update the cart
      if (newQuantity !== item.quantity) {
         updateQuantity(item.id, newQuantity);
      }
       // Always update the input value to the corrected valid quantity on blur
      setInputValue(newQuantity.toString());
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
        {/* Link to product details page */}
        {/* Assuming your product details route is /products/[productId] */}
        <p className="text-lg font-semibold text-primary transition-colors">
          {item.name}
        </p>

        {/* Display price per unit in parentheses */}
        <p className="text-sm text-muted-foreground">({formatPrice(item.price)} ליחידה)</p>

        {/* Quantity controls similar to ProductCard */}
        <div className="flex items-center gap-1 mt-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleDecreaseQuantity} // Use the new handler
            className="h-7 w-7 rounded-full"
             // Disable if less than or equal to one box
            disabled={item.quantity <= (item.unitsPerBox > 0 ? item.unitsPerBox : 1)}
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            min={item.unitsPerBox > 0 ? item.unitsPerBox : 1} // Minimum is one box
            step={item.unitsPerBox > 0 ? item.unitsPerBox : 1} // Step by one box
            value={inputValue} // Use the state variable for input value
            readOnly // Make the input field read-only
            className="h-7 w-12 text-center px-1 text-sm border-input focus:ring-primary focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" // Added classes for styling
            aria-label="כמות"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleIncreaseQuantity} // Use the new handler
            className="h-7 w-7 rounded-full"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>

      </div>
      <div className="flex flex-col items-end gap-2">
        {/* Removed individual item subtotal display */}
        <Button variant="ghost" size="icon" onClick={handleRemove} className="text-destructive hover:text-destructive">
          <XIcon className="h-5 w-5" />
          <span className="sr-only">הסר פריט</span>
        </Button>
      </div>
    </div>
  );
}
