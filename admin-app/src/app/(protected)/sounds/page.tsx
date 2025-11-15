"use client"
import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { DataTable } from '@/components/data-table/DataTable'
import { ColumnDef } from '@tanstack/react-table'

type SoundRow = {
  _id: string
  title?: string
  url?: string
  duration?: number
  createdAt?: string
}

const columns: ColumnDef<SoundRow>[] = [
  { accessorKey: '_id', header: 'ID' },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'url', header: 'URL' },
  { accessorKey: 'duration', header: 'Duration (s)' },
  { accessorKey: 'createdAt', header: 'Created' },
]

export default function SoundsPage() {
  const [data, setData] = useState<SoundRow[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    if (query) params.set('q', query)
    const res = await api.get(`/api/sounds?${params.toString()}`)
    const payload = res.data
    const list: SoundRow[] = payload.sounds || payload.data || payload
    setData(list)
    setTotal(payload.pagination?.total ?? list.length)
  }

  useEffect(() => { load() }, [page, pageSize])

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h1 className="mr-auto text-xl font-semibold">Sounds</h1>
        <input
          placeholder="Search..."
          className="h-9 w-56 rounded-md border bg-transparent px-3"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="h-9 rounded-md border px-3" onClick={() => { setPage(1); load() }}>Search</button>
      </div>
      <DataTable
        columns={columns}
        data={data}
        pageInfo={{ page, pageSize, total }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        onSearch={() => { setPage(1); load() }}
      />
    </div>
  )
}
