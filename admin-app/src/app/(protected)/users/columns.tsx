"use client"
import { ColumnDef } from '@/components/data-table/DataTable'
import { formatDate } from '@/lib/utils'

export type UserRow = {
  _id: string
  username?: string
  email?: string
  role?: string
  createdAt?: string
}

export const userColumns: ColumnDef<UserRow>[] = [
  { accessorKey: 'username', header: 'Username', cell: ({ row }) => row.original.username || '—' },
  { accessorKey: 'email', header: 'Email', cell: ({ row }) => row.original.email || '—' },
  { accessorKey: 'role', header: 'Role', cell: ({ row }) => row.original.role || 'user' },
  { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
]
