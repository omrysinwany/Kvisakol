
'use client';

import Image from 'next/image';
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
import { useRouter } from 'next/navigation';

interface ProductTableProps {
  products: Product[];
  onDeleteProduct: (productId: string, productName: string) => void;
  onToggleActive: (productId: string, productName: string, currentStatus: boolean) => void;
}

export function ProductTable({ products, onDeleteProduct, onToggleActive }: ProductTableProps) {
  const router = useRouter();

  const formatPrice = (price: number) => {
    return `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const handleRowClick = (productId: string) => {
    router.push(`/admin/products/edit/${productId}`);
  };

  return (
    <Table className="text-xs">
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
          <TableRow 
            key={product.id} 
            onClick={() => handleRowClick(product.id)}
            className="cursor-pointer"
          >
            <TableCell className="hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
              <div className="relative h-12 w-12 overflow-hidden rounded-md">
                <Image
                  src={product.imageUrl || 'https://placehold.co/48x48.png'}
                  alt={product.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                  data-ai-hint={product.dataAiHint as string}
                  onError={(e) => {
                    e.currentTarget.srcset = 'https://placehold.co/48x48.png';
                    e.currentTarget.src = 'https://placehold.co/48x48.png';
                  }}
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
            <TableCell className="text-left" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">פתח תפריט פעולות</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleRowClick(product.id)} className="flex items-center gap-2 cursor-pointer">
                      <Edit2 className="h-4 w-4" />
                      ערוך מוצר
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleActive(product.id, product.name, product.isActive)} className="flex items-center gap-2 cursor-pointer">
                    {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {product.isActive ? 'הפוך ללא פעיל' : 'הפוך לפעיל'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDeleteProduct(product.id, product.name)} className="text-destructive flex items-center gap-2 cursor-pointer">
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
