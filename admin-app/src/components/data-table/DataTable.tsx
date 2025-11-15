"use client"
import * as React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'

type PageInfo = { page: number; pageSize: number; total: number }

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageInfo?: PageInfo
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onSearch?: (q: string) => void
  meta?: any
}

export function DataTable<TData, TValue>({ columns, data, pageInfo, onPageChange, onPageSizeChange, onSearch, meta }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [search, setSearch] = React.useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    meta,
  })

  return (
    <div data-cy="data-table" className="space-y-3">
      <div className="flex items-center gap-2">
        <Input data-cy="search-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch?.(search)} className="max-w-xs" />
        <Button data-cy="search-button" variant="secondary" onClick={() => onSearch?.(search)}>Search</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="select-none">
                      {header.isPlaceholder ? null : (
                        <div
                          className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow data-cy="table-row" key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {pageInfo ? `Page ${pageInfo.page} · ${pageInfo.total} total` : null}
        </div>
        <div className="flex items-center gap-2">
          <select
            data-cy="page-size-select"
            className="h-9 rounded-md border bg-transparent px-2"
            value={pageInfo?.pageSize ?? 20}
            onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s} / page
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <Button data-cy="prev-page-button" variant="outline" onClick={() => onPageChange?.(Math.max(1, (pageInfo?.page ?? 1) - 1))}>Prev</Button>
            <Button data-cy="next-page-button" variant="outline" onClick={() => onPageChange?.((pageInfo?.page ?? 1) + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export type { ColumnDef }
