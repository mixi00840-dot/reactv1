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
import {
  FileText,
  Download,
  Calendar,
  Users,
  ShoppingCart,
  DollarSign,
  Video,
  TrendingUp,
  FileSpreadsheet,
  FileJson,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Report {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  lastGenerated?: string
  status?: "ready" | "generating" | "failed"
}

const availableReports: Report[] = [
  {
    id: "user-activity",
    name: "User Activity Report",
    description: "Detailed breakdown of user registrations, logins, and engagement metrics",
    icon: <Users className="h-5 w-5" />,
    category: "users",
    lastGenerated: "2024-11-14",
    status: "ready"
  },
  {
    id: "sales-revenue",
    name: "Sales & Revenue Report",
    description: "Complete sales data including revenue, orders, and payment methods",
    icon: <DollarSign className="h-5 w-5" />,
    category: "sales",
    lastGenerated: "2024-11-15",
    status: "ready"
  },
  {
    id: "content-performance",
    name: "Content Performance Report",
    description: "Video views, likes, comments, and engagement analytics",
    icon: <Video className="h-5 w-5" />,
    category: "content",
    lastGenerated: "2024-11-13",
    status: "ready"
  },
  {
    id: "product-inventory",
    name: "Product Inventory Report",
    description: "Stock levels, low inventory alerts, and product performance",
    icon: <ShoppingCart className="h-5 w-5" />,
    category: "products",
    lastGenerated: "2024-11-14",
    status: "ready"
  },
  {
    id: "financial-summary",
    name: "Financial Summary",
    description: "Comprehensive financial report with transactions and commission breakdown",
    icon: <TrendingUp className="h-5 w-5" />,
    category: "finance",
    lastGenerated: "2024-11-15",
    status: "generating"
  },
  {
    id: "seller-performance",
    name: "Seller Performance Report",
    description: "Top sellers, seller ratings, and commission earned",
    icon: <Users className="h-5 w-5" />,
    category: "sellers",
    lastGenerated: "2024-11-12",
    status: "ready"
  },
]

export default function ReportsPage() {
  const { toast } = useToast()
  const [selectedReport, setSelectedReport] = useState<string>("")
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "1y" | "custom">("30d")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [format, setFormat] = useState<"csv" | "xlsx" | "pdf" | "json">("csv")
  const [category, setCategory] = useState<string>("all")
  const [isGenerating, setIsGenerating] = useState(false)

  const filteredReports = category === "all" 
    ? availableReports 
    : availableReports.filter(r => r.category === category)

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Report generated",
        description: "Your report has been generated and is ready for download.",
      })
      
      // Simulate download
      const reportName = availableReports.find(r => r.id === reportId)?.name || "Report"
      const fileName = `${reportName.toLowerCase().replace(/\s+/g, '-')}.${format}`
      
      toast({
        title: "Download started",
        description: `Downloading ${fileName}...`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleScheduleReport = () => {
    toast({
      title: "Report scheduled",
      description: "You will receive the report via email at the specified time.",
    })
  }

  const handleExportAll = async () => {
    setIsGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      toast({
        title: "Bulk export completed",
        description: "All reports have been exported successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export reports",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Export</h1>
          <p className="text-muted-foreground">
            Generate and download comprehensive platform reports
          </p>
        </div>
        <Button onClick={handleExportAll} disabled={isGenerating}>
          <Download className="mr-2 h-4 w-4" />
          {isGenerating ? "Exporting..." : "Export All"}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Available Reports</p>
              <p className="text-2xl font-bold">{availableReports.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Ready to Export</p>
              <p className="text-2xl font-bold">
                {availableReports.filter(r => r.status === "ready").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Generating</p>
              <p className="text-2xl font-bold">
                {availableReports.filter(r => r.status === "generating").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Download className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Downloads Today</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Configuration */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Report Configuration</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="sellers">Sellers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateRange">Date Range</Label>
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={format} onValueChange={(v: any) => setFormat(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel (XLSX)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button className="w-full" variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Schedule Report
            </Button>
          </div>
        </div>

        {dateRange === "custom" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Available Reports */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          Available Reports ({filteredReports.length})
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-3">
                  {report.icon}
                </div>
                <div className="flex items-center gap-2">
                  {report.status === "ready" && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {report.status === "generating" && (
                    <Clock className="h-5 w-5 animate-pulse text-orange-600" />
                  )}
                  {report.status === "failed" && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>

              <h4 className="mb-2 font-semibold">{report.name}</h4>
              <p className="mb-4 text-sm text-muted-foreground">
                {report.description}
              </p>

              {report.lastGenerated && (
                <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Last generated: {report.lastGenerated}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={isGenerating || report.status === "generating"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {report.status === "generating" ? "Generating..." : "Download"}
                </Button>
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Downloads */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Recent Downloads</h3>
        <div className="space-y-3">
          {[
            {
              name: "Sales & Revenue Report",
              date: "2024-11-15 10:30 AM",
              format: "CSV",
              size: "2.4 MB",
              user: "Admin User"
            },
            {
              name: "User Activity Report",
              date: "2024-11-15 09:15 AM",
              format: "PDF",
              size: "1.8 MB",
              user: "Admin User"
            },
            {
              name: "Content Performance Report",
              date: "2024-11-14 04:20 PM",
              format: "XLSX",
              size: "3.2 MB",
              user: "Admin User"
            },
            {
              name: "Product Inventory Report",
              date: "2024-11-14 02:10 PM",
              format: "CSV",
              size: "1.5 MB",
              user: "Admin User"
            },
          ].map((download, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{download.name}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{download.date}</span>
                    <span>•</span>
                    <span>{download.format}</span>
                    <span>•</span>
                    <span>{download.size}</span>
                    <span>•</span>
                    <span>{download.user}</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Scheduled Reports */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Scheduled Reports</h3>
          <Button size="sm" variant="outline" onClick={handleScheduleReport}>
            <Clock className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        </div>
        <div className="space-y-3">
          {[
            {
              name: "Weekly Sales Summary",
              frequency: "Every Monday at 9:00 AM",
              format: "PDF",
              recipients: "admin@mixillo.com, manager@mixillo.com",
              active: true
            },
            {
              name: "Monthly Revenue Report",
              frequency: "1st of every month at 8:00 AM",
              format: "XLSX",
              recipients: "admin@mixillo.com",
              active: true
            },
            {
              name: "Daily User Activity",
              frequency: "Every day at 11:59 PM",
              format: "CSV",
              recipients: "analytics@mixillo.com",
              active: false
            },
          ].map((schedule, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between rounded-lg border p-4"
            >
              <div className="flex items-start gap-4">
                <Mail className="mt-1 h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <p className="font-medium">{schedule.name}</p>
                    {schedule.active ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <Clock className="mr-1 inline h-3 w-3" />
                      {schedule.frequency}
                    </p>
                    <p>
                      <FileText className="mr-1 inline h-3 w-3" />
                      Format: {schedule.format}
                    </p>
                    <p>
                      <Mail className="mr-1 inline h-3 w-3" />
                      {schedule.recipients}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost">
                  Edit
                </Button>
                <Button size="sm" variant="ghost">
                  {schedule.active ? "Pause" : "Resume"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
