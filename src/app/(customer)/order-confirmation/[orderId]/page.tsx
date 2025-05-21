'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center items-center">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold">הזמנתך התקבלה בהצלחה!</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-lg mb-2">
            תודה רבה על הזמנתך.
          </CardDescription>
          {orderId && <p className="text-muted-foreground mb-1">מספר הזמנה: <span className="font-semibold text-foreground">{orderId}</span></p>}
          <p className="text-muted-foreground mb-6">
            הסוכן שלנו יצור עמך קשר בהקדם לאישור פרטי ההזמנה והמשלוח.
          </p>
          <Button asChild size="lg">
            <Link href="/">חזרה לקטלוג המוצרים</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
