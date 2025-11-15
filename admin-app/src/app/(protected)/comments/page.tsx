"use client"
import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { DataTable } from '@/components/data-table/DataTable'
import { commentColumns, type CommentRow } from './columns'

export default function CommentsPage() {
  const [data, setData] = useState<CommentRow[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<string>('')
  const [query, setQuery] = useState('')

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    if (status) params.set('status', status)
    if (query) params.set('q', query)
    const res = await api.get(`/api/admin/comments?${params.toString()}`)
    const payload = res.data
    const list: CommentRow[] = payload.comments || payload.data || payload
    setData(list)
    setTotal(payload.pagination?.total ?? list.length)
  }

  useEffect(() => { load() }, [page, pageSize, status])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 data-cy="page-title" className="mr-auto text-xl font-semibold">Comments</h1>
        <input
          placeholder="Search text..."
          className="h-9 w-56 rounded-md border bg-transparent px-3"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="h-9 rounded-md border px-3"
          onClick={() => { setPage(1); load() }}
        >Search</button>
        <select data-cy="filter-status" className="h-9 rounded-md border bg-transparent px-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="spam">Spam</option>
        </select>
      </div>
      <DataTable
        columns={commentColumns}
        data={data}
        pageInfo={{ page, pageSize, total }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        onSearch={() => { setPage(1); load() }}
        meta={{ refresh: load }}
      />
    </div>
  )
}
