"use client"
import { ColumnDef } from '@/components/data-table/DataTable'
import { formatDate } from '@/lib/utils'

export type OrderRow = {
  _id: string
  number?: string
  total?: number
  status?: string
  createdAt?: string
}

export const orderColumns: ColumnDef<OrderRow>[] = [
  { accessorKey: 'number', header: 'Order #' },
  { accessorKey: 'total', header: 'Total', cell: ({ row }) => `$${(row.original.total ?? 0).toFixed(2)}` },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
]
