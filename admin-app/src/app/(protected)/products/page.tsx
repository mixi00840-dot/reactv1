"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DataTable } from '@/components/data-table/DataTable';
import { productColumns, type ProductRow } from './columns';

export default function ProductsPage() {
  const [data, setData] = useState<ProductRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize), q });
    const res = await api.get(`/api/products?${params.toString()}`);
    const payload = res.data;
    const list: ProductRow[] = payload.products || payload.data || payload;
    setData(list);
    setTotal(payload.pagination?.total ?? payload.total ?? list.length);
  }

  useEffect(() => { load(); }, [page, pageSize]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Products</h1>
      <DataTable
        columns={productColumns}
        data={data}
        pageInfo={{ page, pageSize, total }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        onSearch={(query) => { setQ(query); setPage(1); load(); }}
      />
    </section>
  );
}
