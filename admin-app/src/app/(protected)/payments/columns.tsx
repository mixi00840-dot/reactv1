"use client"
import { ColumnDef } from '@/components/data-table/DataTable'
import { formatDate } from '@/lib/utils'

export type PaymentRow = {
  _id: string
  amount?: number
  currency?: string
  status?: string
  paymentMethod?: string
  createdAt?: string
  userId?: { username?: string; email?: string }
  orderId?: { orderNumber?: string }
}

export const paymentColumns: ColumnDef<PaymentRow>[] = [
  { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => formatDate(row.original.createdAt) },
  { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `${row.original.currency || 'USD'} ${(row.original.amount ?? 0).toFixed(2)}` },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'paymentMethod', header: 'Method' },
  { accessorKey: 'user', header: 'User', cell: ({ row }) => row.original.userId?.username || row.original.userId?.email || '—' },
  { accessorKey: 'order', header: 'Order', cell: ({ row }) => row.original.orderId?.orderNumber || '—' },
]
