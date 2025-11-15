"use client"
import { ColumnDef } from '@/components/data-table/DataTable'

export type CoinPackageRow = {
  _id: string
  name?: string
  coins?: number
  price?: number
  currency?: string
  status?: string
}

export const coinPackageColumns: ColumnDef<CoinPackageRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'coins', header: 'Coins' },
  { accessorKey: 'price', header: 'Price', cell: ({ row }) => `${row.original.currency || 'USD'} ${(row.original.price ?? 0).toFixed(2)}` },
  { accessorKey: 'status', header: 'Status' },
]
