'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { UploadCloud } from 'lucide-react';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,   // ← Added this import
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createProductService, updateProductService } from '@/services/product-service';

const NO_CATEGORY_VALUE = "--NO_CATEGORY--";

const productFormSchema = z.object({
  name:           z.string().min(3,  { message: 'שם מוצר חייב להכיל לפחות 3 תווים.' }),
  description:    z.string().min(10, { message: 'תיאור חייב להכיל לפחות 10 תווים.' }),
  price:          z.coerce.number().positive({ message: 'מחיר חייב להיות מספר חיובי.' }),
  consumerPrice:  z.coerce.number().positive({ message: 'מחיר לצרכן חייב להיות מספר חיובי.' }),
  imageUrl:       z.string().url({ message: 'כתובת תמונה לא תקינה.' }).optional().or(z.literal('')),
  category:       z.string().optional().default(NO_CATEGORY_VALUE),
  isActive:       z.boolean().default(true),
  unitsPerBox:    z.coerce.number().int().positive({ message: 'כמות יחידות בקרטון חייבת להיות מספר שלם וחיובי.' }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: Product | null;
  onSubmitSuccess?: (product: Product) => void;
  availableCategories: string[];
}

export function ProductForm({
  initialData,
  onSubmitSuccess,
  availableCategories,
}: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          price:         Number(initialData.price),
          consumerPrice: Number(initialData.consumerPrice),
          category:      initialData.category || NO_CATEGORY_VALUE,
          imageUrl:      initialData.imageUrl || '',
          unitsPerBox:   Number(initialData.unitsPerBox) || 1,
          isActive:      initialData.isActive,
        }
      : {
          name:           '',
          description:    '',
          price:          0,
          consumerPrice:  0,
          imageUrl:       '',
          category:       NO_CATEGORY_VALUE,
          isActive:       true,
          unitsPerBox:    1,
        },
  });

  const { handleSubmit, reset, formState } = methods;

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        price:         Number(initialData.price),
        consumerPrice: Number(initialData.consumerPrice),
        category:      initialData.category || NO_CATEGORY_VALUE,
        imageUrl:      initialData.imageUrl || '',
        unitsPerBox:   Number(initialData.unitsPerBox) || 1,
        isActive:      initialData.isActive,
      });
      setImagePreview(initialData.imageUrl);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: ProductFormValues) => {
    const finalCategory = data.category === NO_CATEGORY_VALUE ? '' : data.category;
    const finalImageUrl = data.imageUrl || initialData?.imageUrl || '/images/products/placeholder.jpg';

    const productToSave: Product = {
      id:            initialData?.id || `prod-${Date.now()}`,
      name:          data.name,
      description:   data.description,
      price:         Number(data.price),
      consumerPrice: Number(data.consumerPrice),
      imageUrl:      finalImageUrl,
      dataAiHint:    initialData?.dataAiHint || 'custom product',
      category:      finalCategory,
      unitsPerBox:   Number(data.unitsPerBox),
      isActive:      data.isActive,
    };

    try {
      if (initialData) {
        await updateProductService(productToSave.id, productToSave);
      } else {
        await createProductService(productToSave);
      }

      toast({
        title:       initialData ? 'מוצר עודכן!' : 'מוצר נוצר!',
        description: `המוצר "${data.name}" ${initialData ? 'עודכן' : 'נוצר'} בהצלחה.`,
      });

      onSubmitSuccess?.(productToSave);
      router.push('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title:       'שגיאה בשמירת מוצר',
        description: 'אירעה שגיאה בעת שמירת פרטי המוצר. נסה שוב מאוחר יותר.',
        variant:     'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'עריכת מוצר' : 'הוספת מוצר חדש'}</CardTitle>
        <CardDescription>
          {initialData
            ? 'עדכן את פרטי המוצר.'
            : 'מלא את הפרטים ליצירת מוצר חדש בקטלוג.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2">
                <FormLabel>תמונת מוצר</FormLabel>
                <div className="aspect-square w-full relative border rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="תצוגת מוצר"
                      fill
                      className="object-cover"
                      onError={() => setImagePreview('/images/products/placeholder.jpg')}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <UploadCloud className="h-12 w-12 mx-auto" />
                      <p className="mt-2 text-sm">אין תמונה זמינה</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <FormField
                  control={methods.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם מוצר</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='לדוגמה: אבקת כביסה "כביסכל אקסטרה"'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={methods.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תיאור מוצר</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="פרט על המוצר..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={methods.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מחיר (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="35.50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={methods.control}
                    name="consumerPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מחיר לצרכן (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="39.90"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={methods.control}
                    name="unitsPerBox"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>יחידות בקרטון</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            placeholder="12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={methods.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>קטגוריה</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="בחר קטגוריה..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_CATEGORY_VALUE}>
                              ללא קטגוריה
                            </SelectItem>
                            {availableCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={methods.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <FormLabel>מוצר פעיל</FormLabel>
                        <FormDescription>
                          האם להציג בקטלוג?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <CardFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={formState.isSubmitting}
              >
                {formState.isSubmitting
                  ? initialData ? 'מעדכן...' : 'יוצר...'
                  : initialData ? 'שמור שינויים' : 'צור מוצר'}
              </Button>
            </CardFooter>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
