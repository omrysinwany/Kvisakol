
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { UploadCloud } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NO_CATEGORY_VALUE = "--NO_CATEGORY--";

const productFormSchema = z.object({
  name: z.string().min(3, { message: 'שם מוצר חייב להכיל לפחות 3 תווים.' }),
  description: z.string().min(10, { message: 'תיאור חייב להכיל לפחות 10 תווים.' }),
  price: z.coerce.number().positive({ message: 'מחיר חייב להיות מספר חיובי.' }),
  imageUrl: z.string().url({ message: 'כתובת תמונה לא תקינה.' }).optional().or(z.literal('')),
  category: z.string().optional().default(NO_CATEGORY_VALUE),
  isActive: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: Product | null;
  onSubmitSuccess?: (product: Product) => void;
  availableCategories: string[];
}

export function ProductForm({ initialData, onSubmitSuccess, availableCategories }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          price: Number(initialData.price),
          category: initialData.category || NO_CATEGORY_VALUE,
          imageUrl: initialData.imageUrl || '',
        }
      : {
          name: '',
          description: '',
          price: 0,
          imageUrl: '',
          category: NO_CATEGORY_VALUE,
          isActive: true,
        },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        price: Number(initialData.price),
        category: initialData.category || NO_CATEGORY_VALUE,
        imageUrl: initialData.imageUrl || '',
      });
      setImagePreview(initialData.imageUrl);
    }
  }, [initialData, form]);
  

  const onSubmit = async (data: ProductFormValues) => {
    console.log('Product form submitted:', data);

    const finalCategory = data.category === NO_CATEGORY_VALUE ? '' : data.category;

    const finalImageUrl = initialData?.imageUrl || '/images/products/placeholder.jpg'; 

    const newOrUpdatedProduct: Product = {
      id: initialData?.id || `prod-${Date.now()}`, 
      ...data,
      price: Number(data.price), 
      imageUrl: finalImageUrl,
      dataAiHint: initialData?.dataAiHint || 'custom product',
      category: finalCategory,
    };

    if (onSubmitSuccess) {
      onSubmitSuccess(newOrUpdatedProduct);
    } else {
      toast({
        title: initialData ? 'מוצר עודכן!' : 'מוצר נוצר!',
        description: `המוצר "${data.name}" ${initialData ? 'עודכן' : 'נוצר'} בהצלחה.`,
      });
      router.push('/admin/products');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'עריכת מוצר' : 'הוספת מוצר חדש'}</CardTitle>
        <CardDescription>
          {initialData ? 'עדכן את פרטי המוצר.' : 'מלא את הפרטים ליצירת מוצר חדש בקטלוג.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2">
                <FormLabel>תמונת מוצר</FormLabel>
                  <div className="aspect-square w-full relative border rounded-lg flex flex-col justify-center items-center overflow-hidden">
                    {imagePreview ? (
                      <Image 
                        src={imagePreview} 
                        alt="תצוגת מוצר" 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover rounded-lg" 
                        data-ai-hint={initialData?.dataAiHint || 'product image'}
                        onError={(e) => {
                            e.currentTarget.srcset = '/images/products/placeholder.jpg';
                            e.currentTarget.src = '/images/products/placeholder.jpg';
                            setImagePreview('/images/products/placeholder.jpg');
                        }}
                      />
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        <UploadCloud className="h-12 w-12 mx-auto" />
                        <p className="mt-2 text-sm">אין תמונה זמינה</p>
                      </div>
                    )}
                  </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם מוצר</FormLabel>
                      <FormControl>
                        <Input placeholder='לדוגמה: אבקת כביסה "כביסכל אקסטרה"' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תיאור מוצר</FormLabel>
                      <FormControl>
                        <Textarea placeholder="פרט על המוצר, יתרונותיו, הוראות שימוש מיוחדות וכו'." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מחיר (₪)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="לדוגמה: 39.90" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>קטגוריה</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || NO_CATEGORY_VALUE}
                            >
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר קטגוריה..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value={NO_CATEGORY_VALUE}> 
                                    <em>ללא קטגוריה</em>
                                </SelectItem>
                                {availableCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                    {cat}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                  </div>
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>מוצר פעיל</FormLabel>
                        <FormDescription>
                          האם המוצר יוצג בקטלוג ללקוחות?
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
             <CardFooter className="mt-8 p-0 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  ביטול
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (initialData ? 'מעדכן...' : 'יוצר...') : (initialData ? 'שמור שינויים' : 'צור מוצר')}
                </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
