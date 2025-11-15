"use client"
import { ColumnDef } from '@/components/data-table/DataTable'
import { formatDate } from '@/lib/utils'

export type CouponRow = {
  _id: string
  code?: string
  name?: string
  type?: string
  status?: string
  discountValue?: number
  validFrom?: string
  validUntil?: string
}

export const couponColumns: ColumnDef<CouponRow>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'discountValue', header: 'Value' },
  { accessorKey: 'validFrom', header: 'From', cell: ({ row }) => formatDate(row.original.validFrom) },
  { accessorKey: 'validUntil', header: 'Until', cell: ({ row }) => formatDate(row.original.validUntil) },
]
