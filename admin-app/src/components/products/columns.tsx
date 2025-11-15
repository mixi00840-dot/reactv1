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
import { MoreHorizontal, Eye, CheckCircle, XCircle, Edit, Trash2, Package } from "lucide-react"

// Product type definition
export type Product = {
  _id: string
  name: string
  description?: string
  price: number
  images?: string[]
  category?: string
  seller?: {
    _id: string
    username: string
    avatar?: string
  }
  status: "pending" | "active" | "inactive" | "rejected" | "out_of_stock"
  stock?: number
  sold?: number
  rating?: number
  reviews?: number
  createdAt: string
  updatedAt?: string
}

// Column action handlers interface
export interface ColumnActions {
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onApprove: (product: Product) => void
  onReject: (product: Product) => void
  onToggleStatus: (product: Product) => void
  onDelete: (product: Product) => void
}

// Status badge color mapping
const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  active: "default",
  inactive: "secondary",
  rejected: "destructive",
  out_of_stock: "destructive",
}

export const createProductColumns = (actions: ColumnActions): ColumnDef<Product>[] => [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original
      const image = product.images?.[0]
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-md">
            <AvatarImage src={image} alt={product.name} className="object-cover" />
            <AvatarFallback className="rounded-md">
              <Package className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{product.name}</span>
            {product.category && (
              <span className="text-xs text-muted-foreground">{product.category}</span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "seller",
    header: "Seller",
    cell: ({ row }) => {
      const seller = row.original.seller
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={seller?.avatar} alt={seller?.username} />
            <AvatarFallback className="text-xs">
              {seller?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{seller?.username || "Unknown"}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      return <span className="font-medium">${row.original.price.toFixed(2)}</span>
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.original.stock || 0
      return (
        <span className={`text-sm font-medium ${stock === 0 ? "text-red-600" : stock < 10 ? "text-orange-600" : ""}`}>
          {stock}
        </span>
      )
    },
  },
  {
    accessorKey: "sold",
    header: "Sold",
    cell: ({ row }) => {
      return <span className="text-sm">{row.original.sold || 0}</span>
    },
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => {
      const rating = row.original.rating || 0
      const reviews = row.original.reviews || 0
      return (
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({reviews})</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={statusColors[status] || "default"} className="capitalize">
          {status.replace("_", " ")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      return <span className="text-sm text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const product = row.original

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
            <DropdownMenuItem onClick={() => actions.onView(product)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEdit(product)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {product.status === "pending" && (
              <>
                <DropdownMenuItem onClick={() => actions.onApprove(product)} className="text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.onReject(product)} className="text-red-600">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
            {product.status === "active" && (
              <DropdownMenuItem onClick={() => actions.onToggleStatus(product)} className="text-orange-600">
                <XCircle className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            )}
            {product.status === "inactive" && (
              <DropdownMenuItem onClick={() => actions.onToggleStatus(product)} className="text-green-600">
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => actions.onDelete(product)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
