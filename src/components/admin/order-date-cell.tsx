'use client'

import { formatInTimeZone } from 'date-fns-tz'
import { he } from 'date-fns/locale'
import { TableCell } from '@/components/ui/table'

interface OrderDateCellProps {
  ts: string
}

export function OrderDateCell({ ts }: OrderDateCellProps) {
  return (
    <TableCell className="hidden md:table-cell">
      {formatInTimeZone(
        new Date(ts),
        'Asia/Jerusalem',
        'dd/MM/yyyy HH:mm',
        { locale: he }
      )}
    </TableCell>
  )
}
