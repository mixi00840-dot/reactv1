"use client"
import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'

type AnalyticsData = {
  usersGrowth?: any[]
  contentStats?: any[]
  salesStats?: any[]
  engagementStats?: any
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const res = await api.get('/api/admin/analytics')
      setData(res.data.analytics || {})
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div>Loading analytics...</div>

  const contentByStatus = data.contentStats?.reduce((acc: any, item: any) => {
    acc[item._id] = item.count
    return acc
  }, {})

  const salesByStatus = data.salesStats?.reduce((acc: any, item: any) => {
    acc[item._id] = { count: item.count, revenue: item.totalRevenue || 0 }
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">User Growth (30 days)</h3>
          <p className="text-2xl font-bold">{data.usersGrowth?.reduce((sum, d) => sum + (d.count || 0), 0) || 0}</p>
          <p className="text-xs text-muted-foreground">New users</p>
        </Card>

        <Card className="p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Content Stats</h3>
          <div className="space-y-1 text-sm">
            <div>Active: {contentByStatus?.active || 0}</div>
            <div>Reported: {contentByStatus?.reported || 0}</div>
            <div>Inactive: {contentByStatus?.inactive || 0}</div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Sales (30 days)</h3>
          <p className="text-2xl font-bold">${salesByStatus?.completed?.revenue?.toFixed(2) || '0.00'}</p>
          <p className="text-xs text-muted-foreground">{salesByStatus?.completed?.count || 0} orders</p>
        </Card>

        <Card className="p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Avg Engagement</h3>
          <div className="space-y-1 text-sm">
            <div>Views: {data.engagementStats?.avgViews?.toFixed(1) || 0}</div>
            <div>Likes: {data.engagementStats?.avgLikes?.toFixed(1) || 0}</div>
            <div>Comments: {data.engagementStats?.avgComments?.toFixed(1) || 0}</div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 font-medium">User Growth Chart</h3>
        <div className="space-y-1 text-sm">
          {data.usersGrowth?.slice(-10).map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between">
              <span>{item._id?.year}-{String(item._id?.month).padStart(2, '0')}-{String(item._id?.day).padStart(2, '0')}</span>
              <span className="font-medium">{item.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
