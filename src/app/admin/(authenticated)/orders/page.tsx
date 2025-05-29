import { Suspense } from 'react'
import OrdersClient from './OrdersClient'
import type { Order } from '@/lib/types'
import { getOrdersForAdmin } from '@/services/order-service'

export default async function AdminOrdersPage() {
  // הפונקציה הזו תרוץ ב-SSR ותביא את כל ההזמנות
  const initialOrders: Order[] = await getOrdersForAdmin()

  return (
    // Suspense כדי להמתין לטעינת הקומפוננטה בצד הקליינט
    <Suspense fallback={<div className="p-4 text-center">טוען הזמנות…</div>}>
      <OrdersClient initialOrders={initialOrders} />
    </Suspense>
  )
}

