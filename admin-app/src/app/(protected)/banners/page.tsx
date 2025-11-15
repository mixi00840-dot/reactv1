"use client"
import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { DataTable } from '@/components/data-table/DataTable'
import { bannerColumns, type BannerRow } from './columns'

export default function BannersPage() {
  const [data, setData] = useState<BannerRow[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    const res = await api.get(`/api/admin/banners?${params.toString()}`)
    const payload = res.data?.data || res.data
    const list: BannerRow[] = payload.banners || payload.data || payload
    setData(list)
    const p = payload.pagination || res.data?.data?.pagination || res.data?.pagination
    setTotal(p?.total ?? list.length)
  }

  useEffect(() => { load() }, [page, pageSize])

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Banners</h1>
      <DataTable
        columns={bannerColumns}
        data={data}
        pageInfo={{ page, pageSize, total }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        onSearch={() => {}}
      />
    </div>
  )
}
