"use client"
import { ColumnDef } from '@/components/data-table/DataTable'

export type BannerRow = {
  _id: string
  title?: string
  position?: string
  status?: string
  isActive?: boolean
}

export const bannerColumns: ColumnDef<BannerRow>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'position', header: 'Position' },
  { accessorKey: 'isActive', header: 'Active', cell: ({ row }) => (row.original.isActive ? 'Yes' : 'No') },
  { accessorKey: 'status', header: 'Status' },
]
