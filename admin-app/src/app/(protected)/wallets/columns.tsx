"use client"
import { ColumnDef } from '@/components/data-table/DataTable'

export type WalletRow = {
  _id: string
  balance?: number
  currency?: string
  userId?: { username?: string; email?: string }
}

export const walletColumns: ColumnDef<WalletRow>[] = [
  { accessorKey: 'user', header: 'User', cell: ({ row }) => row.original.userId?.username || row.original.userId?.email || '—' },
  { accessorKey: 'balance', header: 'Balance', cell: ({ row }) => `${row.original.currency || 'USD'} ${(row.original.balance ?? 0).toFixed(2)}` },
]
