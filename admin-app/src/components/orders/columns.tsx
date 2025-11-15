"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Package, Truck, CheckCircle, XCircle } from "lucide-react"

// Order type definition
export type Order = {
  _id: string
  orderNumber?: string
  customer?: {
    _id: string
    username: string
    avatar?: string
  }
  items?: Array<{
    product: any
    quantity: number
    price: number
  }>
  total: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  paymentMethod?: string
  shippingAddress?: string
  createdAt: string
  updatedAt?: string
}

// Column action handlers interface
export interface ColumnActions {
  onView: (order: Order) => void
  onUpdateStatus: (order: Order, status: string) => void
  onCancel: (order: Order) => void
  onRefund: (order: Order) => void
}

// Status badge color mapping
const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  processing: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "secondary",
}

const paymentStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  paid: "default",
  failed: "destructive",
  refunded: "secondary",
}

export const createOrderColumns = (actions: ColumnActions): ColumnDef<Order>[] => [
  {
    accessorKey: "orderNumber",
    header: "Order #",
    cell: ({ row }) => {
      return <span className="font-mono text-sm">{row.original.orderNumber || row.original._id.slice(-8).toUpperCase()}</span>
    },
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original.customer
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={customer?.avatar} alt={customer?.username} />
            <AvatarFallback className="text-xs">
              {customer?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{customer?.username || "Unknown"}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const itemCount = row.original.items?.length || 0
      return <span className="text-sm">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      return <span className="font-medium">${row.original.total.toFixed(2)}</span>
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const status = row.original.paymentStatus
      return (
        <Badge variant={paymentStatusColors[status] || "default"} className="capitalize">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Order Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={statusColors[status] || "default"} className="capitalize">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      return <span className="text-sm text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const order = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => actions.onView(order)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {order.status === "pending" && (
              <DropdownMenuItem onClick={() => actions.onUpdateStatus(order, "confirmed")} className="text-green-600">
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Order
              </DropdownMenuItem>
            )}
            {order.status === "confirmed" && (
              <DropdownMenuItem onClick={() => actions.onUpdateStatus(order, "processing")}>
                <Package className="mr-2 h-4 w-4" />
                Start Processing
              </DropdownMenuItem>
            )}
            {order.status === "processing" && (
              <DropdownMenuItem onClick={() => actions.onUpdateStatus(order, "shipped")}>
                <Truck className="mr-2 h-4 w-4" />
                Mark as Shipped
              </DropdownMenuItem>
            )}
            {order.status === "shipped" && (
              <DropdownMenuItem onClick={() => actions.onUpdateStatus(order, "delivered")} className="text-green-600">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Delivered
              </DropdownMenuItem>
            )}
            {(order.status === "pending" || order.status === "confirmed") && (
              <DropdownMenuItem onClick={() => actions.onCancel(order)} className="text-red-600">
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </DropdownMenuItem>
            )}
            {order.status === "delivered" && order.paymentStatus === "paid" && (
              <DropdownMenuItem onClick={() => actions.onRefund(order)} className="text-orange-600">
                <XCircle className="mr-2 h-4 w-4" />
                Process Refund
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
