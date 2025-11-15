"use client"
import { ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'

export type ContentRow = {
  _id: string
  caption?: string
  title?: string
  status?: string
  createdAt?: string
  creator?: { username?: string; email?: string }
}

export const contentColumns: ColumnDef<ContentRow>[] = [
  { accessorKey: 'creator', header: 'Creator', cell: ({ row }) => row.original.creator?.username || row.original.creator?.email || '—' },
  { accessorKey: 'caption', header: 'Caption', cell: ({ row }) => row.original.caption || row.original.title || '—' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const handleStatus = async (status: string) => {
        try {
          await api.put(`/api/admin/content/${row.original._id}/status`, { status })
          ;(table.options.meta as any)?.refresh?.()
        } catch (err) {
          console.error('Status update failed:', err)
        }
      }
      return (
        <div className="flex gap-1">
          {row.original.status !== 'active' && (
            <button data-cy="action-activate" className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700" onClick={() => handleStatus('active')}>Activate</button>
          )}
          {row.original.status !== 'inactive' && (
            <button data-cy="action-deactivate" className="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-700" onClick={() => handleStatus('inactive')}>Deactivate</button>
          )}
          {row.original.status !== 'banned' && (
            <button data-cy="action-ban" className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700" onClick={() => handleStatus('banned')}>Ban</button>
          )}
        </div>
      )
    },
  },
]
