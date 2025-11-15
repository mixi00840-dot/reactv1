"use client"
import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'

type DashboardStats = {
  totalUsers?: number
  activeUsers?: number
  totalStores?: number
  totalProducts?: number
  totalOrders?: number
  totalRevenue?: number
  pendingOrders?: number
  totalContent?: number
  activeContent?: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const res = await api.get('/api/admin/dashboard')
      setStats(res.data.stats || {})
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div data-cy="dashboard-loading">Loading dashboard...</div>

  const metrics = [
    { label: 'Total Users', value: stats.totalUsers || 0 },
    { label: 'Active Users', value: stats.activeUsers || 0 },
    { label: 'Total Stores', value: stats.totalStores || 0 },
    { label: 'Total Products', value: stats.totalProducts || 0 },
    { label: 'Total Orders', value: stats.totalOrders || 0 },
    { label: 'Pending Orders', value: stats.pendingOrders || 0 },
    { label: 'Total Content', value: stats.totalContent || 0 },
    { label: 'Active Content', value: stats.activeContent || 0 },
    { label: 'Revenue', value: `$${(stats.totalRevenue || 0).toFixed(2)}` },
  ]

  return (
    <div className="space-y-6">
      <h1 data-cy="dashboard-title" className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label} data-cy="metric-card" className="p-4">
            <h3 className="mb-1 text-sm font-medium text-muted-foreground">{m.label}</h3>
            <p className="text-2xl font-bold">{m.value}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
