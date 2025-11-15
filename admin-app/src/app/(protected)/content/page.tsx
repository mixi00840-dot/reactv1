"use client"
import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { DataTable } from '@/components/data-table/DataTable'
import { contentColumns, type ContentRow } from './columns'

export default function ContentPage() {
  const [data, setData] = useState<ContentRow[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<string>('')

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    if (status) params.set('status', status)
    const res = await api.get(`/api/admin/content?${params.toString()}`)
    const payload = res.data
    const list: ContentRow[] = payload.contents || payload.data || payload
    setData(list)
    setTotal(payload.pagination?.total ?? list.length)
  }

  useEffect(() => { load() }, [page, pageSize, status])

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h1 data-cy="page-title" className="mr-auto text-xl font-semibold">Content</h1>
        <select data-cy="filter-status" className="h-9 rounded-md border bg-transparent px-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>
      <DataTable
        columns={contentColumns}
        data={data}
        pageInfo={{ page, pageSize, total }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        onSearch={() => {}}
        meta={{ refresh: load }}
      />
    </div>
  )
}
