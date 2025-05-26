
'use client';

import type { CustomerSummary } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Phone, MapPin, CalendarDays, ShoppingBag, UserCircle, ListOrdered, Edit2, Save, UserRoundX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Textarea } from '../ui/textarea';

interface CustomerDetailViewProps {
  customer: CustomerSummary;
  onSaveGeneralNotes: (customerId: string, notes: string) => Promise<void>;
  onSaveCustomerName: (customerId: string, newName: string) => Promise<void>;
}

export function CustomerDetailView({ customer, onSaveGeneralNotes, onSaveCustomerName }: CustomerDetailViewProps) {
  const formatPrice = (price: number) => `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const [currentGeneralNotes, setCurrentGeneralNotes] = useState(customer.generalAgentNotes || '');
  const [isSavingGeneralNotes, setIsSavingGeneralNotes] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(customer.name);

  // Update editedName if customer prop changes (e.g., after a save and re-fetch)
  useEffect(() => {
    setEditedName(customer.name);
    setCurrentGeneralNotes(customer.generalAgentNotes || '');
  }, [customer]);

  const handleSaveNotes = async () => {
    setIsSavingGeneralNotes(true);
    await onSaveGeneralNotes(customer.id, currentGeneralNotes);
    setIsSavingGeneralNotes(false);
  };

  const handleEditNameToggle = () => {
    if (isEditingName) { // If currently editing, try to save
      if (editedName.trim() && editedName.trim() !== customer.name) {
        onSaveCustomerName(customer.id, editedName.trim()).then(() => {
          setIsEditingName(false); // Switch back to view mode only after successful save (or if no change)
        });
      } else if (editedName.trim() === customer.name) {
        setIsEditingName(false); // No change, just switch back
      } else {
        // Name is empty, don't save, stay in edit mode or show error (handled by onSaveCustomerName)
      }
    } else { // If not editing, switch to edit mode
      setEditedName(customer.name); // Ensure input starts with current name
      setIsEditingName(true);
    }
  };
  
  const handleNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(event.target.value);
  };
  
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-grow min-w-0"> {/* Added flex-grow and min-w-0 */}
                <UserCircle className="h-8 w-8 text-primary shrink-0" /> {/* Added shrink-0 */}
                {!isEditingName ? (
                    <CardTitle className="text-2xl truncate" title={customer.name}>{customer.name}</CardTitle> 
                ) : (
                    <Input 
                        value={editedName} 
                        onChange={handleNameInputChange} 
                        className="text-2xl font-semibold h-10 flex-grow" // Use font-semibold for consistency with CardTitle
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault(); // Prevent form submission if inside one
                            handleEditNameToggle(); // Trigger save
                          } else if (e.key === 'Escape') {
                            setIsEditingName(false);
                            setEditedName(customer.name); // Revert to original name
                          }
                        }}
                    />
                )}
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleEditNameToggle} 
                title={isEditingName ? "שמור שם" : "ערוך שם"}
                className="shrink-0" // Added shrink-0
            >
                {isEditingName ? <Save className="h-5 w-5 text-green-600" /> : <Edit2 className="h-5 w-5 text-muted-foreground hover:text-primary" />}
            </Button>
          </div>
          <CardDescription className="flex items-center gap-1.5 text-sm pt-1">
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
                <Edit2 className="w-4 h-4 text-primary"/>
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
              <span>סך כל ההוצאות של הלקוח (מהזמנות שהושלמו): </span>
              <span className="font-semibold text-primary">{formatPrice(customer.totalSpent)}</span>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

