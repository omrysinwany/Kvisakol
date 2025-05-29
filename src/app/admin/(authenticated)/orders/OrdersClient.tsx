'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { OrderTable } from '@/components/admin/order-table'
import { AdminPaginationControls } from '@/components/admin/admin-pagination-controls'
import { getOrdersForAdmin, updateOrderStatusService } from '@/services/order-service'
import type { Order } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, X, UserSearch, ClipboardList } from 'lucide-react'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { he } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface OrdersClientProps {
  initialOrders: Order[]
}

type StatusFilterValue = Order['status'] | 'all'
const ITEMS_PER_PAGE = 10

const availableStatuses: StatusFilterValue[] = ['all', 'new', 'received', 'completed', 'cancelled']
const statusLabels: Record<StatusFilterValue, string> = {
  all: 'כל הסטטוסים',
  new: 'חדשה',
  received: 'התקבלה',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
}

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // --- state ראשוני מה־SSR ---
  const [orders, setOrders] = useState<Order[]>(initialOrders)

  // --- פילטרים ו-UI state ---
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all')
  const [customerPhoneInput, setCustomerPhoneInput] = useState('')
  const [customerPhoneFilter, setCustomerPhoneFilter] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [currentPage, setCurrentPage] = useState(1)

  // קביעת פילטרים ראשוניים מ־URL
  useEffect(() => {
    const s = searchParams.get('status') as StatusFilterValue | null
    if (s && availableStatuses.includes(s)) setStatusFilter(s)

    const phone = searchParams.get('customerPhone')
    setCustomerPhoneFilter(phone)
    setCustomerPhoneInput(phone || '')

    const period = searchParams.get('period')
    const today = new Date()
    if (period === 'today') {
      setStartDate(startOfDay(today))
      setEndDate(endOfDay(today))
    } else if (period === 'thisWeek') {
      const sevenDaysAgo = subDays(today, 6)
      setStartDate(startOfDay(sevenDaysAgo))
      setEndDate(endOfDay(today))
    } else if (!phone && !s) {
      setStartDate(undefined)
      setEndDate(undefined)
    }

    setCurrentPage(1)
  }, [searchParams])

  // --- לוגיקת update סטטוס ---
  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updated = await updateOrderStatusService(orderId, newStatus)
      if (updated) {
        setOrders(o => o.map(x => x.id === orderId ? updated : x))
        toast({
          title: 'סטטוס הזמנה עודכן',
          description: `#${orderId.slice(-6)} → ${statusLabels[newStatus]}`,
        })
      } else {
        toast({ variant: 'destructive', title: 'שגיאה', description: 'לא ניתן לעדכן סטטוס.' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'אירעה תקלה בעדכון סטטוס.' })
    }
  }

  // --- פילטרים על המערך ---
  const filtered = useMemo(() => {
    let tmp = orders

    if (customerPhoneFilter) {
      tmp = tmp.filter(o => o.customerPhone.includes(customerPhoneFilter))
    }
    if (statusFilter !== 'all') {
      tmp = tmp.filter(o => o.status === statusFilter)
    }
    if (startDate) {
      tmp = tmp.filter(o => new Date(o.orderTimestamp) >= startOfDay(startDate))
    }
    if (endDate) {
      tmp = tmp.filter(o => new Date(o.orderTimestamp) <= endOfDay(endDate))
    }

    return tmp
  }, [orders, customerPhoneFilter, statusFilter, startDate, endDate])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const pageSlice  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // --- handlers לשינוי פילטרים ב-URL ---
  const applyPhoneFilter = () => {
    const trimmed = customerPhoneInput.trim()
    setCustomerPhoneFilter(trimmed || null)
    setCurrentPage(1)
    const p = new URLSearchParams(searchParams.toString())
    trimmed ? p.set('customerPhone', trimmed) : p.delete('customerPhone')
    router.replace(`/admin/orders?${p.toString()}`)
  }
  const clearPhoneFilter = () => {
    setCustomerPhoneInput('')
    setCustomerPhoneFilter(null)
    setCurrentPage(1)
    const p = new URLSearchParams(searchParams.toString())
    p.delete('customerPhone')
    router.replace(`/admin/orders?${p.toString()}`)
  }
  const clearDates = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setCurrentPage(1)
    const p = new URLSearchParams(searchParams.toString())
    p.delete('period')
    router.replace(`/admin/orders?${p.toString()}`)
  }

  if (!orders.length) {
    return <div className="p-4 text-center">אין הזמנות להצגה.</div>
  }

  return (
    <>
      {/* כותרת עמוד */}
      <div className="mb-8 py-4 text-center bg-card shadow-sm rounded-lg">
        <h1 className="text-3xl font-bold text-primary">ניהול הזמנות</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
                רשימת הזמנות ({filtered.length})
              </CardTitle>
              <CardDescription>נהל את כל ההזמנות שהתקבלו</CardDescription>
            </div>
          </div>

          {/* פילטרים */}
          <div className="pt-4 space-y-3">
            {/* חיפוש טלפון + סטטוס */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <UserSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="tel"
                  value={customerPhoneInput}
                  onChange={e => setCustomerPhoneInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && applyPhoneFilter()}
                  placeholder="חיפוש לפי טלפון"
                  className="pl-10 text-xs"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={v => {
                  setStatusFilter(v as StatusFilterValue)
                  setCurrentPage(1)
                  const p = new URLSearchParams(searchParams.toString())
                  v === 'all' ? p.delete('status') : p.set('status', v)
                  router.replace(`/admin/orders?${p.toString()}`)
                }}
              >
                <SelectTrigger className="h-9 w-full px-3 text-xs">
                  {statusFilter === 'all' ? 'כל הסטטוסים' : <SelectValue />}
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map(s => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* פילטר תאריכים */}
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('justify-start text-left text-xs', !startDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-1 h-4 w-4" />
                    {startDate ? format(startDate, 'd/M/yy', { locale: he }) : 'מתאריך'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={d => { setStartDate(d); setCurrentPage(1) }}
                    disabled={d => endDate ? d > endDate : false}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('justify-start text-left text-xs', !endDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-1 h-4 w-4" />
                    {endDate ? format(endDate, 'd/M/yy', { locale: he }) : 'עד תאריך'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={d => { setEndDate(d); setCurrentPage(1) }}
                    disabled={d => startDate ? d < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* כפתורי נקה */}
            <div className="flex items-center gap-2 flex-wrap">
              {(startDate || endDate) && (
                <Button variant="ghost" size="icon" onClick={clearDates}>
                  <X className="h-4 w-4" />
                </Button>
              )}
              {customerPhoneFilter && (
                <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 text-xs rounded">
                  <UserSearch className="h-4 w-4 text-primary" />
                  <span>מספר: {customerPhoneFilter}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {pageSlice.length > 0 ? (
            <>
              <OrderTable orders={pageSlice} onUpdateStatus={handleUpdateStatus} />
              {totalPages > 1 && (
                <AdminPaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={p => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                />
              )}
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              לא נמצאו הזמנות התואמות את הקריטריונים
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
