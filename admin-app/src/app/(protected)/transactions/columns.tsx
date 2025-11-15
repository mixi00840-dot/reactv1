"use client"
import { ColumnDef } from '@/components/data-table/DataTable'
import { formatDate } from '@/lib/utils'

export type TransactionRow = {
  _id: string
  amount?: number
  status?: string
  type?: string
  reference?: string
  description?: string
  createdAt?: string
  userId?: { username?: string; email?: string }
}

export const transactionColumns: ColumnDef<TransactionRow>[] = [
  { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => formatDate(row.original.createdAt) },
  { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `${(row.original.amount ?? 0).toFixed(2)}` },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'reference', header: 'Ref' },
  { accessorKey: 'user', header: 'User', cell: ({ row }) => row.original.userId?.username || row.original.userId?.email || '—' },
]
