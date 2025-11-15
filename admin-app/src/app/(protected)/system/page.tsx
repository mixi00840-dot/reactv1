"use client"
import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'

type SystemMetrics = {
  mongodb?: { connected: boolean; collections: number }
  redis?: { connected: boolean; usedMemory: string }
  providers?: any[]
  activeProvider?: string
}

export default function SystemPage() {
  const [metrics, setMetrics] = useState<SystemMetrics>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const [dbRes, providersRes] = await Promise.all([
        api.get('/api/admin/database/stats'),
        api.get('/api/admin/stream-providers'),
      ])
      setMetrics({
        mongodb: dbRes.data.mongodb,
        redis: dbRes.data.redis,
        providers: providersRes.data.providers,
        activeProvider: providersRes.data.activeProvider,
      })
    } catch (err) {
      console.error('Failed to load system metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div>Loading system info...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">System Settings</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-2 font-medium">MongoDB</h3>
          <div className="space-y-1 text-sm">
            <div>Status: <span className={metrics.mongodb?.connected ? 'text-green-600' : 'text-red-600'}>{metrics.mongodb?.connected ? 'Connected' : 'Disconnected'}</span></div>
            <div>Collections: {metrics.mongodb?.collections || 0}</div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-2 font-medium">Redis</h3>
          <div className="space-y-1 text-sm">
            <div>Status: <span className={metrics.redis?.connected ? 'text-green-600' : 'text-red-600'}>{metrics.redis?.connected ? 'Connected' : 'Disconnected'}</span></div>
            <div>Memory: {metrics.redis?.usedMemory || 'N/A'}</div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 font-medium">Streaming Providers</h3>
        <p className="mb-3 text-sm text-muted-foreground">Active: {metrics.activeProvider}</p>
        <div className="space-y-2">
          {metrics.providers?.map((p: any) => (
            <div key={p.id} className="rounded border p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{p.name}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${p.status === 'configured' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {p.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Features: {p.features?.join(', ')}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
