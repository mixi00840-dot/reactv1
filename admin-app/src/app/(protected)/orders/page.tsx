"use client"

import { useState } from "react"
import { createOrderColumns, type Order } from "@/components/orders/columns"
import { useOrders } from "@/hooks/use-api"
import { Card } from "@/components/ui/card"
import { ShoppingBag, Clock, Truck, CheckCircle } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<any>({})
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)

  const { toast } = useToast()
  const { data, isLoading, refetch } = useOrders(page, 20, filters)

  // Stats calculations
  const totalOrders = data?.pagination?.total || 0
  const pendingOrders = data?.orders?.filter((o: Order) => o.status === "pending").length || 0
  const processingOrders = data?.orders?.filter((o: Order) => o.status === "processing" || o.status === "confirmed").length || 0
  const completedOrders = data?.orders?.filter((o: Order) => o.status === "delivered").length || 0

  const handleView = (order: Order) => {
    setSelectedOrder(order)
    setShowDetailsDialog(true)
  }

  const handleUpdateStatus = async (order: Order, status: string) => {
    try {
      // Add API call to update order status
      toast({
        title: "Status Updated",
        description: `Order status updated to ${status}.`,
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = (order: Order) => {
    setSelectedOrder(order)
    setShowCancelDialog(true)
  }

  const handleCancelConfirm = async () => {
    if (!selectedOrder) return
    try {
      // Add API call to cancel order
      toast({
        title: "Order Cancelled",
        description: "The order has been cancelled.",
      })
      setShowCancelDialog(false)
      setSelectedOrder(null)
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel order.",
        variant: "destructive",
      })
    }
  }

  const handleRefund = (order: Order) => {
    setSelectedOrder(order)
    setShowRefundDialog(true)
  }

  const handleRefundConfirm = async () => {
    if (!selectedOrder) return
    try {
      // Add API call to process refund
      toast({
        title: "Refund Processed",
        description: "The refund has been processed successfully.",
      })
      setShowRefundDialog(false)
      setSelectedOrder(null)
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process refund.",
        variant: "destructive",
      })
    }
  }

  const columns = createOrderColumns({
    onView: handleView,
    onUpdateStatus: handleUpdateStatus,
    onCancel: handleCancel,
    onRefund: handleRefund,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
          <p className="text-muted-foreground">Track and manage customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button>Export Orders</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{pendingOrders}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Processing</p>
              <p className="text-2xl font-bold text-blue-600">{processingOrders}</p>
            </div>
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Select
            value={filters.status || "all"}
            onValueChange={(value: string) =>
              setFilters({ ...filters, status: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.paymentStatus || "all"}
            onValueChange={(value: string) =>
              setFilters({ ...filters, paymentStatus: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="p-6">
        <DataTable
          columns={columns}
          data={data?.orders || []}
          searchKey="orderNumber"
        />
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="info" className="w-full">
            <TabsList>
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>Order Number</Label>
                  <p className="font-mono text-sm">{selectedOrder?.orderNumber || selectedOrder?._id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer</Label>
                    <p className="text-sm">{selectedOrder?.customer?.username || "Unknown"}</p>
                  </div>
                  <div>
                    <Label>Order Status</Label>
                    <p className="text-sm capitalize">{selectedOrder?.status}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Order Date</Label>
                    <p className="text-sm">{selectedOrder?.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "N/A"}</p>
                  </div>
                  <div>
                    <Label>Total Amount</Label>
                    <p className="text-lg font-bold">${selectedOrder?.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="items" className="space-y-4">
              <div className="space-y-2">
                {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{item.product?.name || "Product"}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${item.price.toFixed(2)}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex h-20 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">No items</p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="shipping" className="space-y-4">
              <div>
                <Label>Shipping Address</Label>
                <p className="text-sm">{selectedOrder?.shippingAddress || "No address provided"}</p>
              </div>
            </TabsContent>
            <TabsContent value="payment" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>Payment Status</Label>
                  <p className="text-sm capitalize font-medium">{selectedOrder?.paymentStatus}</p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <p className="text-sm capitalize">{selectedOrder?.paymentMethod || "N/A"}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="text-2xl font-bold">${selectedOrder?.total.toFixed(2)}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              No, Keep Order
            </Button>
            <Button variant="destructive" onClick={handleCancelConfirm}>
              Yes, Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process a refund for this order. The customer will be refunded the full amount of ${selectedOrder?.total.toFixed(2)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRefundConfirm}>
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
