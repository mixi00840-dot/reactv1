"use client"
import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { DataTable } from '@/components/data-table/DataTable'
import { paymentColumns, type PaymentRow } from './columns'

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentRow[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    if (q) params.set('search', q)
    if (status) params.set('status', status)
    const res = await api.get(`/api/payments/admin/all?${params.toString()}`)
    const payload = res.data?.data || res.data
    const list: PaymentRow[] = payload.payments || payload.transactions || payload
    setData(list)
    const p = payload.pagination || res.data?.data?.pagination || res.data?.pagination
    setTotal(p?.total ?? p?.totalTransactions ?? list.length)
  }

  useEffect(() => { load() }, [page, pageSize, status])

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h1 className="mr-auto text-xl font-semibold">Payments</h1>
        <select className="h-9 rounded-md border bg-transparent px-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <DataTable
        columns={paymentColumns}
        data={data}
        pageInfo={{ page, pageSize, total }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        onSearch={(query) => { setQ(query); setPage(1); load() }}
      />
    </div>
  )
}
