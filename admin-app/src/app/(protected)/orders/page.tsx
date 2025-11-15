"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DataTable } from '@/components/data-table/DataTable';
import { orderColumns, type OrderRow } from './columns';

export default function OrdersPage() {
  const [data, setData] = useState<OrderRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize), q });
    const res = await api.get(`/api/orders?${params.toString()}`);
    const payload = res.data;
    const list: OrderRow[] = payload.orders || payload.data || payload;
    setData(list);
    setTotal(payload.pagination?.total ?? payload.total ?? list.length);
  }

  useEffect(() => { load() }, [page, pageSize]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Orders</h1>
      <DataTable
        columns={orderColumns}
        data={data}
        pageInfo={{ page, pageSize, total }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        onSearch={(query) => { setQ(query); setPage(1); load() }}
      />
    </div>
  )
}
