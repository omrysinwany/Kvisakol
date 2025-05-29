'use client';

import type { Order } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Printer,
  CheckCircle,
  XCircle,
  Hourglass,
  Phone,
  MapPin,
  FileText,
  ClipboardCheck,
  Save,
  Edit2,
  PlusCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';

interface OrderDetailViewProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
  onSaveAgentNotes: (orderId: string, notes: string) => Promise<void>;
}

const statusTranslations: Record<Order['status'], string> = {
  new: 'חדשה',
  received: 'התקבלה',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
};

const statusColors: Record<Order['status'], string> = {
  new: 'bg-blue-500 hover:bg-blue-600',
  received: 'bg-amber-500 hover:bg-amber-600',
  completed: 'bg-green-500 hover:bg-green-600',
  cancelled: 'bg-red-500 hover:bg-red-600',
};

const statusIcons: Record<Order['status'], React.ElementType> = {
  new: Hourglass,
  received: ClipboardCheck,
  completed: CheckCircle,
  cancelled: XCircle,
};

export function OrderDetailView({
  order,
  onUpdateStatus,
  onSaveAgentNotes,
}: OrderDetailViewProps) {
  const formatPrice = (price: number) =>
    `₪${price.toLocaleString('he-IL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const StatusIcon = statusIcons[order.status];

  const [currentAgentNotes, setCurrentAgentNotes] = useState(order.agentNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isEditingAgentNotes, setIsEditingAgentNotes] = useState(false);

  useEffect(() => {
    setCurrentAgentNotes(order.agentNotes || '');
    setIsEditingAgentNotes(false);
  }, [order]);

  const handleSaveNotesInternal = async () => {
    setIsSavingNotes(true);
    await onSaveAgentNotes(order.id, currentAgentNotes);
    setIsSavingNotes(false);
  };

  const handleCancelEditNotes = () => {
    setCurrentAgentNotes(order.agentNotes || '');
    setIsEditingAgentNotes(false);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-2xl">
              הזמנה #{order.id.substring(order.id.length - 6)}
            </CardTitle>
            <CardDescription>
              תאריך הזמנה:{' '}
              {format(new Date(order.orderTimestamp), 'dd/MM/yyyy HH:mm', {
                locale: he,
              })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
            <Badge
              variant="default"
              className={`${statusColors[order.status]} text-white text-sm px-3 py-1`}
            >
              <StatusIcon className="h-4 w-4 ml-1.5" />
              {statusTranslations[order.status]}
            </Badge>
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  שנה סטטוס
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup
                    value={order.status}
                    onValueChange={(newStatus) =>
                      onUpdateStatus(order.id, newStatus as Order['status'])
                    }
                  >
                    {(['new', 'received', 'completed', 'cancelled'] as Order['status'][]).map(
                      (statusKey) => (
                        <DropdownMenuRadioItem
                          key={statusKey}
                          value={statusKey}
                          className="cursor-pointer"
                        >
                          {statusTranslations[statusKey]}
                        </DropdownMenuRadioItem>
                      )
                    )}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="ml-2 h-4 w-4" />
              הדפס
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* פרטי לקוח */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">פרטי לקוח</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>שם:</strong> {order.customerName}
                </p>
                {order.customerBusinessName && (
                  <p>
                    <strong>שם עסק:</strong> {order.customerBusinessName}
                  </p>
                )}
                <p className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-muted-foreground" /> <strong>טלפון:</strong>{' '}
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="text-primary hover:underline"
                  >
                    {order.customerPhone}
                  </a>
                </p>
                <p className="flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground mt-1" /> <strong>כתובת:</strong>{' '}
                  <a
                    href={`waze://?q=${encodeURIComponent(order.customerAddress)}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {order.customerAddress}
                  </a>
                </p>
              </div>
            </div>

            {/* הערות לקוח */}
            <div className="space-y-2">
              {order.customerNotes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    הערות לקוח
                  </h3>
                  <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                    {order.customerNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* הערות סוכן פנימיות */}
          <div className="mb-4">
            {isEditingAgentNotes ? (
              <>
                <h4 className="text-sm font-medium mb-1.5">ערוך הערות סוכן (פנימי)</h4>
                <Textarea
                  placeholder="הוסף הערות פנימיות לגבי ההזמנה..."
                  value={currentAgentNotes}
                  onChange={(e) => setCurrentAgentNotes(e.target.value)}
                  rows={3}
                  className="bg-background text-sm"
                />
                <div className="flex items-center gap-2 mt-1.5">
                  <Button onClick={handleSaveNotesInternal} size="xs" disabled={isSavingNotes}>
                    <Save className="ml-1.5 h-3.5 w-3.5" />
                    {isSavingNotes ? 'שומר...' : 'שמור הערות'}
                  </Button>
                  <Button variant="outline" size="xs" onClick={handleCancelEditNotes}>
                    ביטול
                  </Button>
                </div>
              </>
            ) : (order.agentNotes && order.agentNotes.trim() !== '') ? (
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <h4 className="text-sm font-medium text-muted-foreground">הערות סוכן:</h4>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setIsEditingAgentNotes(true)}
                    className="text-xs h-6 px-1.5"
                  >
                    <Edit2 className="h-3 w-3 ml-1" />
                    ערוך
                  </Button>
                </div>
                <p className="text-sm bg-muted/30 p-2 rounded-md whitespace-pre-wrap min-h-[40px]">
                  {order.agentNotes}
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                size="xs"
                onClick={() => { setCurrentAgentNotes(''); setIsEditingAgentNotes(true); }}
                className="text-xs"
              >
                <PlusCircle className="h-3.5 w-3.5 ml-1" />
                הוסף הערות סוכן
              </Button>
            )}
          </div>

          {/* טבלת פריטים - קרטונים במקום כמות */}
          <h3 className="text-lg font-semibold mb-2">פריטים בהזמנה</h3>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">מוצר</TableHead>
                  <TableHead className="text-center whitespace-nowrap">כמות קרטונים</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => {
                  const cartons = Math.ceil(item.quantity / item.unitsPerBox);
                  return (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">
                        {item.productName}
                      </TableCell>
                      <TableCell className="text-center">
                        {cartons}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end items-center bg-muted/30 p-4 rounded-b-md">
          <div className="text-xl font-bold">
            <span>סכום כולל: </span>
            <span className="text-primary">{formatPrice(order.totalAmount)}</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
