"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Input from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  FileText,
  Settings,
  Trash2,
  Edit,
  LogIn,
  LogOut,
  UserPlus,
  ShoppingCart,
  DollarSign,
  Clock,
  Calendar
} from "lucide-react"

interface AuditLog {
  id: string
  timestamp: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  action: string
  category: "auth" | "user" | "content" | "product" | "order" | "system" | "security"
  target?: string
  targetId?: string
  details: string
  ipAddress: string
  userAgent: string
  status: "success" | "failed" | "warning"
  changes?: {
    field: string
    oldValue: string
    newValue: string
  }[]
}

const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    timestamp: "2024-11-15 14:30:25",
    user: {
      id: "admin-1",
      name: "Admin User",
      email: "admin@mixillo.com",
      role: "admin"
    },
    action: "user.ban",
    category: "user",
    target: "User Account",
    targetId: "user-456",
    details: "Banned user @johndoe for violating community guidelines",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    status: "success",
    changes: [
      { field: "status", oldValue: "active", newValue: "banned" },
      { field: "banReason", oldValue: "", newValue: "Spam content" }
    ]
  },
  {
    id: "2",
    timestamp: "2024-11-15 14:28:15",
    user: {
      id: "admin-1",
      name: "Admin User",
      email: "admin@mixillo.com",
      role: "admin"
    },
    action: "content.approve",
    category: "content",
    target: "Video Content",
    targetId: "content-789",
    details: "Approved video content for publication",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    status: "success",
    changes: [
      { field: "status", oldValue: "pending", newValue: "approved" }
    ]
  },
  {
    id: "3",
    timestamp: "2024-11-15 14:25:10",
    user: {
      id: "admin-1",
      name: "Admin User",
      email: "admin@mixillo.com",
      role: "admin"
    },
    action: "auth.login",
    category: "auth",
    details: "Successful admin login",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    status: "success"
  },
  {
    id: "4",
    timestamp: "2024-11-15 14:20:45",
    user: {
      id: "admin-2",
      name: "Manager User",
      email: "manager@mixillo.com",
      role: "manager"
    },
    action: "product.update",
    category: "product",
    target: "Product Listing",
    targetId: "product-123",
    details: "Updated product price and inventory",
    ipAddress: "192.168.1.105",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    status: "success",
    changes: [
      { field: "price", oldValue: "99.99", newValue: "89.99" },
      { field: "stock", oldValue: "50", newValue: "75" }
    ]
  },
  {
    id: "5",
    timestamp: "2024-11-15 14:18:30",
    user: {
      id: "admin-1",
      name: "Admin User",
      email: "admin@mixillo.com",
      role: "admin"
    },
    action: "system.settings.update",
    category: "system",
    target: "System Settings",
    details: "Updated payment gateway configuration",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    status: "success",
    changes: [
      { field: "stripeEnabled", oldValue: "false", newValue: "true" }
    ]
  },
  {
    id: "6",
    timestamp: "2024-11-15 14:15:20",
    user: {
      id: "admin-3",
      name: "Support User",
      email: "support@mixillo.com",
      role: "support"
    },
    action: "order.refund",
    category: "order",
    target: "Order",
    targetId: "order-567",
    details: "Processed refund for cancelled order",
    ipAddress: "192.168.1.110",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    status: "success",
    changes: [
      { field: "status", oldValue: "completed", newValue: "refunded" },
      { field: "refundAmount", oldValue: "0", newValue: "149.99" }
    ]
  },
  {
    id: "7",
    timestamp: "2024-11-15 14:10:05",
    user: {
      id: "admin-1",
      name: "Admin User",
      email: "admin@mixillo.com",
      role: "admin"
    },
    action: "user.delete",
    category: "security",
    target: "User Account",
    targetId: "user-999",
    details: "Deleted user account due to fraudulent activity",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    status: "warning"
  },
  {
    id: "8",
    timestamp: "2024-11-15 14:05:50",
    user: {
      id: "unknown",
      name: "Unknown User",
      email: "unknown@unknown.com",
      role: "unknown"
    },
    action: "auth.login.failed",
    category: "security",
    details: "Failed login attempt - invalid credentials",
    ipAddress: "45.67.89.123",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
    status: "failed"
  }
]

const actionIcons: Record<string, React.ReactNode> = {
  "auth.login": <LogIn className="h-4 w-4" />,
  "auth.logout": <LogOut className="h-4 w-4" />,
  "auth.login.failed": <AlertTriangle className="h-4 w-4" />,
  "user.ban": <Shield className="h-4 w-4" />,
  "user.create": <UserPlus className="h-4 w-4" />,
  "user.update": <Edit className="h-4 w-4" />,
  "user.delete": <Trash2 className="h-4 w-4" />,
  "content.approve": <CheckCircle2 className="h-4 w-4" />,
  "content.reject": <XCircle className="h-4 w-4" />,
  "product.update": <Edit className="h-4 w-4" />,
  "order.refund": <DollarSign className="h-4 w-4" />,
  "system.settings.update": <Settings className="h-4 w-4" />
}

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("7d")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [logs] = useState<AuditLog[]>(mockAuditLogs)

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter
    const matchesStatus = statusFilter === "all" || log.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: React.ReactNode }> = {
      success: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
      failed: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
      warning: { variant: "secondary", icon: <AlertTriangle className="h-3 w-3" /> }
    }
    const config = variants[status] || variants.success
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    )
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      auth: "text-blue-600 bg-blue-100",
      user: "text-purple-600 bg-purple-100",
      content: "text-green-600 bg-green-100",
      product: "text-orange-600 bg-orange-100",
      order: "text-pink-600 bg-pink-100",
      system: "text-gray-600 bg-gray-100",
      security: "text-red-600 bg-red-100"
    }
    return colors[category] || colors.system
  }

  const handleExport = () => {
    // Simulate export
    const csvContent = filteredLogs.map(log => 
      `${log.timestamp},${log.user.name},${log.action},${log.status},${log.ipAddress}`
    ).join('\n')
    console.log("Exporting audit logs:", csvContent)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all administrative actions and system events
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Success</p>
              <p className="text-2xl font-bold">
                {logs.filter(l => l.status === "success").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold">
                {logs.filter(l => l.status === "failed").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Warnings</p>
              <p className="text-2xl font-bold">
                {logs.filter(l => l.status === "warning").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="user">User Management</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateRange">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Audit Logs List */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Activity Log ({filteredLogs.length} events)
          </h3>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filters
          </Button>
        </div>

        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              {/* Icon */}
              <div className={`rounded-lg p-2 ${getCategoryColor(log.category)}`}>
                {actionIcons[log.action] || <FileText className="h-4 w-4" />}
              </div>

              {/* Main Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{log.action.replace(/\./g, ' › ')}</p>
                      {getStatusBadge(log.status)}
                      <Badge variant="outline" className="text-xs">
                        {log.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {log.user.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {log.timestamp}
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {log.ipAddress}
                  </div>
                  {log.target && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {log.target} {log.targetId && `(${log.targetId})`}
                    </div>
                  )}
                </div>

                {log.changes && log.changes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {log.changes.map((change, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <span className="font-medium text-foreground">
                          {change.field}:
                        </span>
                        <span className="rounded bg-red-100 px-1 text-red-800">
                          {change.oldValue || "(empty)"}
                        </span>
                        <span>→</span>
                        <span className="rounded bg-green-100 px-1 text-green-800">
                          {change.newValue}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedLog(null)}
        >
          <Card
            className="w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">Event Details</h3>
                <p className="text-sm text-muted-foreground">
                  Complete information about this audit event
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Event ID</Label>
                  <p className="font-mono text-sm">{selectedLog.id}</p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">{selectedLog.timestamp}</p>
                </div>
                <div>
                  <Label>Action</Label>
                  <p className="text-sm">{selectedLog.action}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Badge variant="outline">{selectedLog.category}</Badge>
                </div>
                <div>
                  <Label>User</Label>
                  <p className="text-sm">{selectedLog.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLog.user.email}
                  </p>
                </div>
                <div>
                  <Label>IP Address</Label>
                  <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                </div>
                {selectedLog.target && (
                  <div>
                    <Label>Target</Label>
                    <p className="text-sm">
                      {selectedLog.target}
                      {selectedLog.targetId && ` (${selectedLog.targetId})`}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label>Details</Label>
                <p className="text-sm">{selectedLog.details}</p>
              </div>

              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div>
                  <Label>Changes</Label>
                  <div className="mt-2 space-y-2">
                    {selectedLog.changes.map((change, idx) => (
                      <div key={idx} className="rounded-lg border p-3">
                        <p className="mb-1 text-sm font-medium">{change.field}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="rounded bg-red-100 px-2 py-1 text-red-800">
                            {change.oldValue || "(empty)"}
                          </span>
                          <span>→</span>
                          <span className="rounded bg-green-100 px-2 py-1 text-green-800">
                            {change.newValue}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>User Agent</Label>
                <p className="font-mono text-xs text-muted-foreground">
                  {selectedLog.userAgent}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
