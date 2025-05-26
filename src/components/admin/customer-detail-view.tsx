
'use client';

import type { CustomerSummary, Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Phone, MapPin, CalendarDays, ShoppingBag, Hash, UserCircle, ListOrdered, Edit3, Save } from 'lucide-react'; // Added Edit3, Save
import { useState } from 'react';
import { Textarea } from '../ui/textarea';

interface CustomerDetailViewProps {
  customer: CustomerSummary;
  onSaveGeneralNotes: (customerId: string, notes: string) => Promise<void>;
}

export function CustomerDetailView({ customer, onSaveGeneralNotes }: CustomerDetailViewProps) {
  const formatPrice = (price: number) => `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const [currentGeneralNotes, setCurrentGeneralNotes] = useState(customer.generalAgentNotes || '');
  const [isSavingGeneralNotes, setIsSavingGeneralNotes] = useState(false);

  const handleSaveNotes = async () => {
    setIsSavingGeneralNotes(true);
    await onSaveGeneralNotes(customer.id, currentGeneralNotes);
    setIsSavingGeneralNotes(false);
  };
  
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">{customer.name}</CardTitle>
          </div>
          <CardDescription className="flex items-center gap-1.5 text-sm">
             <Phone className="w-3.5 h-3.5 text-muted-foreground"/> 
             <a href={`tel:${customer.phone}`} className="text-primary hover:underline">{customer.phone}</a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-6 border-t border-b py-4">
            <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">כתובת אחרונה</div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p>{customer.latestAddress || 'לא זמינה'}</p>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">הזמנה אחרונה</div>
               <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <p>{customer.lastOrderDate ? format(new Date(customer.lastOrderDate), 'dd/MM/yyyy', { locale: he }) : 'לא זמין'}</p>
              </div>
            </div>
             <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">סה"כ הזמנות</div>
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <p>{customer.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-primary"/>
                הערות כלליות לסוכן (פנימי)
            </h3>
            <Textarea
              placeholder="הוסף הערות כלליות לגבי הלקוח (למשל, העדפות, מידע חשוב)..."
              value={currentGeneralNotes}
              onChange={(e) => setCurrentGeneralNotes(e.target.value)}
              rows={3}
              className="bg-background text-sm"
            />
            <Button onClick={handleSaveNotes} size="sm" className="mt-2" disabled={isSavingGeneralNotes}>
              <Save className="ml-2 h-3.5 w-3.5" />
              {isSavingGeneralNotes ? 'שומר...' : 'שמור הערות כלליות'}
            </Button>
          </div>


          <h3 className="text-lg font-semibold mb-3 flex items-center gap-1.5">
            <ListOrdered className="w-4 h-4 text-primary"/>
            היסטוריית הזמנות
          </h3>
          <Button asChild variant="outline">
            <Link href={`/admin/orders?customerPhone=${customer.phone}`}>
              צפה בכל ההזמנות של {customer.name}
            </Link>
          </Button>
        </CardContent>
         <CardFooter className="flex justify-end items-center bg-muted/30 p-3 rounded-b-md mt-6">
            <div className="text-sm">
              <span>סך כל ההוצאות של הלקוח: </span>
              <span className="font-semibold text-primary">{formatPrice(customer.totalSpent)}</span>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
