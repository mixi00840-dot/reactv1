"use client"
import { ColumnDef } from '@/components/data-table/DataTable'
import { formatDate } from '@/lib/utils'

export type ProductRow = {
  _id: string
  name?: string
  price?: number
  status?: string
  createdAt?: string
}

export const productColumns: ColumnDef<ProductRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'price', header: 'Price', cell: ({ row }) => `$${(row.original.price ?? 0).toFixed(2)}` },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
]
