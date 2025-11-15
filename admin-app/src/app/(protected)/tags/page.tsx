"use client"
import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { DataTable } from '@/components/data-table/DataTable'
import { ColumnDef } from '@tanstack/react-table'

type TagRow = { _id: string; name: string; usage?: number; createdAt?: string }

const columns: ColumnDef<TagRow>[] = [
  { accessorKey: '_id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'usage', header: 'Usage' },
  { accessorKey: 'createdAt', header: 'Created' },
]

export default function TagsPage() {
  const [data, setData] = useState<TagRow[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [name, setName] = useState('')

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    const res = await api.get(`/api/admin/tags?${params.toString()}`)
    const payload = res.data
    const list: TagRow[] = payload.tags || payload.data || payload
    setData(list)
    setTotal(payload.pagination?.total ?? list.length)
  }

  async function createTag() {
    if (!name.trim()) return
    await api.post('/api/admin/tags', { name })
    setName('')
    setPage(1)
    await load()
  }

  useEffect(() => { load() }, [page, pageSize])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-semibold">Tags</h1>
        <input className="h-9 w-56 rounded-md border bg-transparent px-3" placeholder="New tag name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="h-9 rounded-md border px-3" onClick={createTag}>Create</button>
      </div>
      <DataTable
        columns={columns}
        data={data}
        pageInfo={{ page, pageSize, total }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        onSearch={() => {}}
      />
    </div>
  )
}
