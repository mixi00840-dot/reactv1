"use client"
import { ColumnDef } from '@/components/data-table/DataTable'
import { formatDate } from '@/lib/utils'

export type StoreRow = {
  _id: string
  name?: string
  owner?: { username?: string }
  status?: string
  createdAt?: string
}

export const storeColumns: ColumnDef<StoreRow>[] = [
  { accessorKey: 'name', header: 'Store' },
  { accessorKey: 'owner.username', header: 'Owner', cell: ({ row }) => row.original.owner?.username || '—' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
]
