"use client"
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import api from '@/lib/api'

export type CommentRow = {
  _id: string
  contentId?: string
  content?: { _id: string; caption?: string }
  user?: { _id: string; username?: string }
  text: string
  status?: string
  createdAt?: string
}

export const commentColumns: ColumnDef<CommentRow>[] = [
  { accessorKey: '_id', header: 'ID' },
  {
    id: 'user',
    header: 'User',
    accessorFn: (row) => row.user?.username ?? '',
  },
  {
    id: 'content',
    header: 'Content',
    accessorFn: (row) => row.content?.caption ?? row.contentId ?? '',
  },
  { accessorKey: 'text', header: 'Text' },
  { accessorKey: 'status', header: 'Status' },
  {
    id: 'createdAt',
    header: 'Created',
    accessorFn: (row) => (row.createdAt ? format(new Date(row.createdAt), 'yyyy-MM-dd HH:mm') : ''),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const handleAction = async (status: string) => {
        try {
          await api.put(`/api/admin/comments/${row.original._id}/status`, { status })
          ;(table.options.meta as any)?.refresh?.()
        } catch (err) {
          console.error('Action failed:', err)
        }
      }
      return (
        <div className="flex gap-1">
          {row.original.status !== 'approved' && (
            <button data-cy="action-approve" className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700" onClick={() => handleAction('approved')}>Approve</button>
          )}
          {row.original.status !== 'rejected' && (
            <button data-cy="action-reject" className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700" onClick={() => handleAction('rejected')}>Reject</button>
          )}
          {row.original.status !== 'spam' && (
            <button data-cy="action-spam" className="rounded bg-orange-600 px-2 py-1 text-xs text-white hover:bg-orange-700" onClick={() => handleAction('spam')}>Spam</button>
          )}
        </div>
      )
    },
  },
]
