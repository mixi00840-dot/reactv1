"use client"

import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { useDashboardStats, useRecentActivities, useUserGrowthData, useRevenueData } from '@/hooks/use-api'
import { Users, ShoppingCart, DollarSign, Package, TrendingUp, Activity, AlertCircle } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { getSocketService } from '@/lib/socket'
import { useNotificationsStore } from '@/store'

// Stat Card Component
function StatCard({ title, value, icon: Icon, trend, color = "blue" }: any) {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
          {trend && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="h-4 w-4" />
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        <div className={`${colors[color as keyof typeof colors]} p-3 rounded-full text-white`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  )
}

// Activity Feed Component
function ActivityFeed({ activities }: any) {
  if (!activities || activities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
        <p className="text-muted-foreground text-center py-8">No recent activities</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
      <div className="space-y-4">
        {activities.slice(0, 10).map((activity: any, index: number) => (
          <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
            <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">{activity.description || activity.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(activity.createdAt || activity.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities()
  const { data: userGrowth, isLoading: userGrowthLoading } = useUserGrowthData(30)
  const { data: revenue, isLoading: revenueLoading } = useRevenueData('daily')
  const addNotification = useNotificationsStore(state => state.addNotification)

  // Connect to Socket.IO for real-time updates
  useEffect(() => {
    const socket = getSocketService()
    socket.connect()

    // Listen for real-time events
    socket.on('user:new', (data: any) => {
      addNotification({
        type: 'info',
        title: 'New User',
        message: `${data.username} just signed up!`,
        read: false,
      })
    })

    socket.on('order:new', (data: any) => {
      addNotification({
        type: 'success',
        title: 'New Order',
        message: `Order #${data.orderId} received - $${data.total}`,
        read: false,
      })
    })

    socket.on('report:new', (data: any) => {
      addNotification({
        type: 'warning',
        title: 'New Report',
        message: `New ${data.type} report received`,
        read: false,
      })
    })

    return () => {
      socket.off('user:new')
      socket.off('order:new')
      socket.off('report:new')
    }
  }, [addNotification])

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers?.toLocaleString() || '0'}
          icon={Users}
          trend={stats?.userGrowth || 0}
          color="blue"
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders?.toLocaleString() || '0'}
          icon={ShoppingCart}
          trend={stats?.orderGrowth || 0}
          color="green"
        />
        <StatCard
          title="Revenue"
          value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          trend={stats?.revenueGrowth || 0}
          color="yellow"
        />
        <StatCard
          title="Products"
          value={stats?.totalProducts?.toLocaleString() || '0'}
          icon={Package}
          color="purple"
        />
      </div>

      {/* Pending Items Alert */}
      {(stats?.pendingOrders || 0) > 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm font-medium">
              You have {stats?.pendingOrders} pending orders and {stats?.pendingReports || 0} unresolved reports
            </p>
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">User Growth (Last 30 Days)</h3>
          {userGrowthLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Revenue Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue (Last 7 Days)</h3>
          {revenueLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Activity Feed */}
      <ActivityFeed activities={activities} />

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Content</h3>
          <p className="text-2xl font-bold">{stats?.activeContent?.toLocaleString() || '0'}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Stores</h3>
          <p className="text-2xl font-bold">{stats?.activeStores?.toLocaleString() || '0'}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Live Streams</h3>
          <p className="text-2xl font-bold">{stats?.liveStreams || '0'}</p>
        </Card>
      </div>
    </div>
  )
}

