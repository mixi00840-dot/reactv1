"use client"

import { useState } from "react"
import { useUserGrowthData, useRevenueData, useDashboardStats } from "@/hooks/use-api"
import { Card } from "@/components/ui/card"
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Eye, 
  ThumbsUp, 
  Package,
  Activity,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AnalyticsPage() {
  const [userGrowthPeriod, setUserGrowthPeriod] = useState(30)
  const [revenuePeriod, setRevenuePeriod] = useState<"daily" | "weekly" | "monthly">("daily")

  const { data: stats } = useDashboardStats()
  const { data: userGrowth } = useUserGrowthData(userGrowthPeriod)
  const { data: revenue } = useRevenueData(revenuePeriod)

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (!previous) return 0
    return ((current - previous) / previous) * 100
  }

  // Mock data for demo purposes
  const contentPerformance = [
    { name: "Videos", value: stats?.totalContent || 2340, color: "#3b82f6" },
    { name: "Active", value: stats?.activeContent || 1890, color: "#10b981" },
    { name: "Pending", value: stats?.pendingContent || 234, color: "#f59e0b" },
    { name: "Flagged", value: stats?.flaggedContent || 56, color: "#ef4444" },
  ]

  const platformMetrics = [
    { metric: "Avg. Session Duration", value: "12m 34s", change: 8.2, trend: "up" },
    { metric: "Bounce Rate", value: "32.4%", change: -5.1, trend: "down" },
    { metric: "Engagement Rate", value: "68.7%", change: 12.3, trend: "up" },
    { metric: "Conversion Rate", value: "4.2%", change: 2.1, trend: "up" },
  ]

  const topProducts = [
    { name: "Premium Package", sales: 234, revenue: 23400 },
    { name: "Starter Bundle", sales: 189, revenue: 9450 },
    { name: "Pro Features", sales: 156, revenue: 15600 },
    { name: "Enterprise Plan", sales: 89, revenue: 44500 },
  ]

  const categoryDistribution = [
    { name: "Electronics", value: 35, color: "#3b82f6" },
    { name: "Fashion", value: 28, color: "#8b5cf6" },
    { name: "Beauty", value: 18, color: "#ec4899" },
    { name: "Home", value: 12, color: "#10b981" },
    { name: "Sports", value: 7, color: "#f59e0b" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive platform performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="30">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${stats?.totalRevenue?.toLocaleString() || "48,392"}</p>
              <div className="mt-2 flex items-center text-sm">
                <ArrowUp className="mr-1 h-4 w-4 text-green-600" />
                <span className="text-green-600">12.5%</span>
                <span className="ml-1 text-muted-foreground">vs last month</span>
              </div>
            </div>
            <DollarSign className="h-10 w-10 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || "12,845"}</p>
              <div className="mt-2 flex items-center text-sm">
                <ArrowUp className="mr-1 h-4 w-4 text-green-600" />
                <span className="text-green-600">8.2%</span>
                <span className="ml-1 text-muted-foreground">vs last month</span>
              </div>
            </div>
            <Users className="h-10 w-10 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{stats?.totalOrders?.toLocaleString() || "3,456"}</p>
              <div className="mt-2 flex items-center text-sm">
                <ArrowDown className="mr-1 h-4 w-4 text-red-600" />
                <span className="text-red-600">3.1%</span>
                <span className="ml-1 text-muted-foreground">vs last month</span>
              </div>
            </div>
            <ShoppingCart className="h-10 w-10 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Products</p>
              <p className="text-2xl font-bold">{stats?.totalProducts?.toLocaleString() || "892"}</p>
              <div className="mt-2 flex items-center text-sm">
                <ArrowUp className="mr-1 h-4 w-4 text-green-600" />
                <span className="text-green-600">15.3%</span>
                <span className="ml-1 text-muted-foreground">vs last month</span>
              </div>
            </div>
            <Package className="h-10 w-10 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Growth Chart */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">User Growth</h3>
                  <p className="text-sm text-muted-foreground">New user registrations over time</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userGrowth || []}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Revenue Chart */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Revenue Trend</h3>
                  <p className="text-sm text-muted-foreground">Revenue by period</p>
                </div>
                <Select value={revenuePeriod} onValueChange={(v: any) => setRevenuePeriod(v)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenue || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Content Performance & Category Distribution */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Content Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={contentPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {contentPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Category Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* Platform Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {platformMetrics.map((metric, idx) => (
              <Card key={idx} className="p-6">
                <p className="text-sm font-medium text-muted-foreground">{metric.metric}</p>
                <p className="mt-2 text-2xl font-bold">{metric.value}</p>
                <div className="mt-2 flex items-center text-sm">
                  {metric.trend === "up" ? (
                    <ArrowUp className="mr-1 h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDown className="mr-1 h-4 w-4 text-red-600" />
                  )}
                  <span className={metric.trend === "up" ? "text-green-600" : "text-red-600"}>
                    {Math.abs(metric.change)}%
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* User Activity Chart */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">User Activity</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Active Users" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          {/* Top Products */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Top Performing Products</h3>
            <div className="space-y-4">
              {topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sales} sales</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${product.revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Revenue Breakdown */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Revenue Breakdown</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={revenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#10b981" name="Revenue" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          {/* Content Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">8.2M</p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Likes</p>
                  <p className="text-2xl font-bold">1.4M</p>
                </div>
                <ThumbsUp className="h-8 w-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                  <p className="text-2xl font-bold">17.2%</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </Card>
          </div>

          {/* Content Performance Over Time */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Content Performance Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={userGrowth || []}>
                <defs>
                  <linearGradient id="colorContent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorContent)"
                  name="Content Created" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
