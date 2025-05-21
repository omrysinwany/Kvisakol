'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ProductTableProps {
  products: Product[];
  onDeleteProduct: (productId: string) => void; // Placeholder for delete action
  onToggleActive: (productId: string, isActive: boolean) => void; // Placeholder for toggle active
}

export function ProductTable({ products, onDeleteProduct, onToggleActive }: ProductTableProps) {
  const { toast } = useToast();

  const handleDelete = (productId: string, productName: string) => {
    // Confirm deletion
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את המוצר "${productName}"?`)) {
      onDeleteProduct(productId);
      toast({
        title: "מוצר נמחק",
        description: `המוצר "${productName}" נמחק בהצלחה.`,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = (productId: string, productName: string, currentStatus: boolean) => {
    onToggleActive(productId, !currentStatus);
    toast({
        title: "סטטוס מוצר עודכן",
        description: `המוצר "${productName}" כעת ${!currentStatus ? "פעיל" : "לא פעיל"}.`,
      });
  }

  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-[100px] sm:table-cell">תמונה</TableHead>
          <TableHead>שם מוצר</TableHead>
          <TableHead>קטגוריה</TableHead>
          <TableHead className="hidden md:table-cell">מחיר</TableHead>
          <TableHead>סטטוס</TableHead>
          <TableHead className="text-left">פעולות</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="hidden sm:table-cell">
              <div className="relative h-12 w-12 overflow-hidden rounded-md">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                  data-ai-hint={product.dataAiHint as string}
                />
              </div>
            </TableCell>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>{product.category || '-'}</TableCell>
            <TableCell className="hidden md:table-cell">{formatPrice(product.price)}</TableCell>
            <TableCell>
              <Badge variant={product.isActive ? 'default' : 'outline'} 
                     className={product.isActive ? 'bg-green-500 hover:bg-green-600 text-white' : ''}>
                {product.isActive ? 'פעיל' : 'לא פעיל'}
              </Badge>
            </TableCell>
            <TableCell className="text-left">
              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">פתח תפריט פעולות</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/products/edit/${product.id}`} className="flex items-center gap-2 cursor-pointer">
                      <Edit2 className="h-4 w-4" />
                      ערוך מוצר
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleActive(product.id, product.name, product.isActive)} className="flex items-center gap-2 cursor-pointer">
                    {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {product.isActive ? 'הפוך ללא פעיל' : 'הפוך לפעיל'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDelete(product.id, product.name)} className="text-destructive flex items-center gap-2 cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                    מחק מוצר
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
