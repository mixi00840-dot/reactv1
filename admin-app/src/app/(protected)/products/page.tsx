"use client"

import { useState } from "react"
import { createProductColumns, type Product } from "@/components/products/columns"
import { useProducts, useApproveProduct, useRejectProduct } from "@/hooks/use-api"
import { Card } from "@/components/ui/card"
import { Package, ShoppingCart, DollarSign, AlertTriangle } from "lucide-react"
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
import Input from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<any>({})
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const { toast } = useToast()
  const { data, isLoading, refetch } = useProducts(page, 20, filters)
  const approveMutation = useApproveProduct()
  const rejectMutation = useRejectProduct()

  // Stats calculations
  const totalProducts = data?.pagination?.total || 0
  const pendingProducts = data?.products?.filter((p: Product) => p.status === "pending").length || 0
  const activeProducts = data?.products?.filter((p: Product) => p.status === "active").length || 0
  const outOfStock = data?.products?.filter((p: Product) => p.status === "out_of_stock" || p.stock === 0).length || 0

  const handleApprove = async (product: Product) => {
    try {
      await approveMutation.mutateAsync(product._id)
      toast({
        title: "Product Approved",
        description: "The product has been approved successfully.",
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve product.",
        variant: "destructive",
      })
    }
  }

  const handleReject = (product: Product) => {
    setSelectedProduct(product)
    setShowRejectDialog(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedProduct) return
    try {
      await rejectMutation.mutateAsync({ id: selectedProduct._id, reason: rejectReason })
      toast({
        title: "Product Rejected",
        description: "The product has been rejected.",
      })
      setShowRejectDialog(false)
      setRejectReason("")
      setSelectedProduct(null)
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject product.",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (product: Product) => {
    try {
      const newStatus = product.status === "active" ? "inactive" : "active"
      // Add API call to toggle status
      toast({
        title: "Status Updated",
        description: `Product ${newStatus === "active" ? "activated" : "deactivated"} successfully.`,
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product status.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = (product: Product) => {
    setSelectedProduct(product)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return
    try {
      // Add delete API call here
      toast({
        title: "Product Deleted",
        description: "The product has been deleted.",
      })
      setShowDeleteDialog(false)
      setSelectedProduct(null)
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      })
    }
  }

  const handleView = (product: Product) => {
    setSelectedProduct(product)
    setShowDetailsDialog(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setShowEditDialog(true)
  }

  const columns = createProductColumns({
    onView: handleView,
    onEdit: handleEdit,
    onApprove: handleApprove,
    onReject: handleReject,
    onToggleStatus: handleToggleStatus,
    onDelete: handleDelete,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products Management</h1>
          <p className="text-muted-foreground">Manage product catalog and inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button>Add Product</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold text-orange-600">{pendingProducts}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.category || "all"}
            onValueChange={(value: string) =>
              setFilters({ ...filters, category: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="beauty">Beauty</SelectItem>
              <SelectItem value="home">Home & Living</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="p-6">
        <DataTable
          columns={columns}
          data={data?.products || []}
          searchKey="name"
        />
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this product submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Reject Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="info" className="w-full">
            <TabsList>
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>Product Name</Label>
                  <p className="text-sm">{selectedProduct?.name}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm">{selectedProduct?.description || "No description"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price</Label>
                    <p className="text-sm font-medium">${selectedProduct?.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <p className="text-sm capitalize">{selectedProduct?.category || "Uncategorized"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Seller</Label>
                    <p className="text-sm">{selectedProduct?.seller?.username || "Unknown"}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p className="text-sm capitalize">{selectedProduct?.status.replace("_", " ")}</p>
                  </div>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{selectedProduct?.createdAt ? new Date(selectedProduct.createdAt).toLocaleString() : "N/A"}</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="images" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {selectedProduct?.images && selectedProduct.images.length > 0 ? (
                  selectedProduct.images.map((img, idx) => (
                    <div key={idx} className="aspect-square overflow-hidden rounded-lg border">
                      <img src={img} alt={`Product ${idx + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 flex h-40 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">No images available</p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="inventory" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>Stock Quantity</Label>
                  <p className="text-2xl font-bold">{selectedProduct?.stock || 0}</p>
                </div>
                <div>
                  <Label>Total Sold</Label>
                  <p className="text-2xl font-bold">{selectedProduct?.sold || 0}</p>
                </div>
                <div>
                  <Label>Stock Status</Label>
                  <p className={`text-sm font-medium ${(selectedProduct?.stock || 0) === 0 ? "text-red-600" : (selectedProduct?.stock || 0) < 10 ? "text-orange-600" : "text-green-600"}`}>
                    {(selectedProduct?.stock || 0) === 0 ? "Out of Stock" : (selectedProduct?.stock || 0) < 10 ? "Low Stock" : "In Stock"}
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>Average Rating</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold">{selectedProduct?.rating?.toFixed(1) || "0.0"}</p>
                    <span className="text-sm text-muted-foreground">out of 5</span>
                  </div>
                </div>
                <div>
                  <Label>Total Reviews</Label>
                  <p className="text-2xl font-bold">{selectedProduct?.reviews || 0}</p>
                </div>
                <p className="text-sm text-muted-foreground">Review details would appear here.</p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information and inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Product Name</Label>
              <Input id="edit-name" defaultValue={selectedProduct?.name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" defaultValue={selectedProduct?.description} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input id="edit-price" type="number" step="0.01" defaultValue={selectedProduct?.price} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-stock">Stock</Label>
                <Input id="edit-stock" type="number" defaultValue={selectedProduct?.stock} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select defaultValue={selectedProduct?.category}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="home">Home & Living</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Product Updated",
                description: "Product information has been updated.",
              })
              setShowEditDialog(false)
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
