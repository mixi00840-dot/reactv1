"use client"
import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { DataTable } from '@/components/data-table/DataTable'
import { transactionColumns, type TransactionRow } from './columns'

export default function TransactionsPage() {
  const [data, setData] = useState<TransactionRow[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<string>('')
  const [type, setType] = useState<string>('')

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    if (q) params.set('search', q)
    if (status) params.set('status', status)
    if (type) params.set('type', type)
    const res = await api.get(`/api/admin/wallets/transactions?${params.toString()}`)
    const payload = res.data?.data || res.data
    const list: TransactionRow[] = payload.transactions || payload.data || payload
    setData(list)
    const p = payload.pagination || res.data?.data?.pagination || res.data?.pagination
    setTotal(p?.total ?? p?.totalTransactions ?? list.length)
  }

  useEffect(() => { load() }, [page, pageSize, status, type])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-semibold">Transactions</h1>
        <select className="h-9 rounded-md border bg-transparent px-2" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}>
          <option value="">All Types</option>
          <option value="topup">Top-up</option>
          <option value="purchase">Purchase</option>
          <option value="gift">Gift</option>
          <option value="transfer">Transfer</option>
        </select>
        <select className="h-9 rounded-md border bg-transparent px-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <DataTable
        columns={transactionColumns}
        data={data}
        pageInfo={{ page, pageSize, total }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        onSearch={(query) => { setQ(query); setPage(1); load() }}
      />
    </div>
  )
}
