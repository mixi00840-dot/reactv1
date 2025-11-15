"use client"
import { ColumnDef } from '@/components/data-table/DataTable'

export type LevelRow = {
  _id: string
  name?: string
  level?: number
  minPoints?: number
  status?: string
}

export const levelColumns: ColumnDef<LevelRow>[] = [
  { accessorKey: 'level', header: 'Level' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'minPoints', header: 'Min Points' },
  { accessorKey: 'status', header: 'Status' },
]
