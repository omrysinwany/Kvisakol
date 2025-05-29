
'use client';

import type { CustomerSummary } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Phone, MapPin, CalendarDays, ShoppingBag, UserCircle, ListOrdered, Edit2, Save, UserRoundX, PlusCircle } from 'lucide-react';
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
  const [isEditingGeneralNotes, setIsEditingGeneralNotes] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(customer.name);

  useEffect(() => {
    setEditedName(customer.name);
    setCurrentGeneralNotes(customer.generalAgentNotes || '');
    setIsEditingGeneralNotes(false); // Reset edit mode if customer data changes externally
  }, [customer]);

  const handleSaveNotesInternal = async () => {
    setIsSavingGeneralNotes(true);
    await onSaveGeneralNotes(customer.id, currentGeneralNotes);
    setIsSavingGeneralNotes(false);
    setIsEditingGeneralNotes(false); 
  };
  
  const handleCancelEditGeneralNotes = () => {
    setCurrentGeneralNotes(customer.generalAgentNotes || '');
    setIsEditingGeneralNotes(false);
  };


  const handleEditNameToggle = () => {
    if (isEditingName) { 
      if (editedName.trim() && editedName.trim() !== customer.name) {
        onSaveCustomerName(customer.id, editedName.trim()).then(() => {
          setIsEditingName(false); 
        });
      } else if (editedName.trim() === customer.name) {
        setIsEditingName(false); 
      }
    } else { 
      setEditedName(customer.name); 
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
            <div className="flex items-center gap-3 flex-grow min-w-0">
                <UserCircle className="h-8 w-8 text-primary shrink-0" />
                {!isEditingName ? (
                    // Display logic: Business name first, fallback to personal name in title
                    // Only personal name is displayed in the title
                    <div className="flex flex-col">
 <CardTitle className="text-2xl truncate" title={customer.customerBusinessName || customer.name}>
 {customer.customerBusinessName || customer.name}
 </CardTitle>
 {/* Display personal name if business name is present */}
 {customer.customerBusinessName && (<p className="text-sm text-muted-foreground font-normal">שם הלקוח: {customer.name}</p>)}
 </div>
                ) : (
                    <Input 
                        value={editedName} 
                        onChange={handleNameInputChange} 
                        className="text-2xl font-semibold h-10 flex-grow"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault(); 
                            handleEditNameToggle(); 
                          } else if (e.key === 'Escape') {
                            setIsEditingName(false);
                            setEditedName(customer.name); 
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
                className="shrink-0"
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
            {isEditingGeneralNotes ? (
              <>
                <h4 className="text-sm font-medium mb-1.5 text-muted-foreground">ערוך הערות כלליות לסוכן</h4>
                <Textarea
                  placeholder="הוסף הערות כלליות לגבי הלקוח (למשל, העדפות, מידע חשוב)..."
                  value={currentGeneralNotes}
                  onChange={(e) => setCurrentGeneralNotes(e.target.value)}
                  rows={3}
                  className="bg-background text-sm"
                />
                <div className="flex items-center gap-2 mt-1.5">
                  <Button onClick={handleSaveNotesInternal} size="sm" disabled={isSavingGeneralNotes}>
                    <Save className="ml-1.5 h-3.5 w-3.5" />
                    {isSavingGeneralNotes ? 'שומר...' : 'שמור הערות'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelEditGeneralNotes} disabled={isSavingGeneralNotes}>
                    ביטול
                  </Button>
                </div>
              </>
            ) : (
              <>
                {(customer.generalAgentNotes && customer.generalAgentNotes.trim() !== '') ? (
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                        <h4 className="text-sm font-medium text-muted-foreground">הערות כלליות לסוכן:</h4>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingGeneralNotes(true)} className="text-xs h-6 px-1.5">
                            <Edit2 className="h-3 w-3 ml-1" />
                            ערוך
                        </Button>
                    </div>
                    <p className="text-sm bg-muted/30 p-2 rounded-md whitespace-pre-wrap min-h-[40px]">{customer.generalAgentNotes}</p>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => { setCurrentGeneralNotes(''); setIsEditingGeneralNotes(true);}} className="text-xs">
                    <PlusCircle className="h-3.5 w-3.5 ml-1"/>
                    הוסף הערות כלליות
                  </Button>
                )}
              </>
            )}
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

