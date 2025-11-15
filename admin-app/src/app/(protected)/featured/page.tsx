"use client"
import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { DataTable } from '@/components/data-table/DataTable'
import { ColumnDef } from '@tanstack/react-table'

type FeaturedRow = {
  _id: string
  type?: string
  refId?: string
  title?: string
  createdAt?: string
}

const columns: ColumnDef<FeaturedRow>[] = [
  { accessorKey: '_id', header: 'ID' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'refId', header: 'Ref ID' },
  { accessorKey: 'createdAt', header: 'Created' },
]

export default function FeaturedPage() {
  const [data, setData] = useState<FeaturedRow[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    const res = await api.get(`/api/admin/featured?${params.toString()}`)
    const payload = res.data
    const list: FeaturedRow[] = payload.items || payload.data || payload
    setData(list)
    setTotal(payload.pagination?.total ?? list.length)
  }

  useEffect(() => { load() }, [page, pageSize])

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h1 className="mr-auto text-xl font-semibold">Featured</h1>
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
