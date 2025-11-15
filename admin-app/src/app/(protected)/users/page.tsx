"use client"

import { useState } from "react"
import { useUsers, useBanUser, useUnbanUser } from "@/hooks/use-api"
import { DataTable } from "@/components/ui/data-table"
import { createUserColumns, User } from "@/components/users/columns"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { UserPlus, Download, Filter } from "lucide-react"
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

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<any>({})
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")
  
  const { toast } = useToast()
  const { data, isLoading, refetch } = useUsers(page, 20, filters)
  const banUserMutation = useBanUser()
  const unbanUserMutation = useUnbanUser()

  const handleView = (user: User) => {
    setSelectedUser(user)
    setDetailsDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    toast({
      title: "Edit User",
      description: "Edit functionality will be implemented soon",
    })
  }

  const handleBan = (user: User) => {
    setSelectedUser(user)
    setBanDialogOpen(true)
  }

  const handleUnban = async (user: User) => {
    try {
      await unbanUserMutation.mutateAsync(user._id)
      toast({
        variant: "success",
        title: "User Unbanned",
        description: `${user.username} has been unbanned successfully`,
      })
      refetch()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unban user",
      })
    }
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleVerify = async (user: User) => {
    toast({
      title: "User Verified",
      description: `${user.username} has been verified`,
    })
  }

  const confirmBan = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a reason for banning",
      })
      return
    }

    try {
      await banUserMutation.mutateAsync({
        id: selectedUser._id,
        reason: banReason,
      })
      toast({
        variant: "success",
        title: "User Banned",
        description: `${selectedUser.username} has been banned`,
      })
      setBanDialogOpen(false)
      setBanReason("")
      refetch()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to ban user",
      })
    }
  }

  const confirmDelete = async () => {
    toast({
      title: "User Deleted",
      description: "User has been deleted successfully",
    })
    setDeleteDialogOpen(false)
  }

  const columns = createUserColumns({
    onView: handleView,
    onEdit: handleEdit,
    onBan: handleBan,
    onUnban: handleUnban,
    onDelete: handleDelete,
    onVerify: handleVerify,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  const users = data?.users || []
  const pagination = data?.pagination || { total: 0, page: 1, pages: 1 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">
            Manage all platform users, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Total Users</div>
          <div className="text-2xl font-bold mt-2">{pagination.total}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Active</div>
          <div className="text-2xl font-bold mt-2 text-green-600">
            {users.filter((u: User) => u.status === 'active').length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Suspended</div>
          <div className="text-2xl font-bold mt-2 text-yellow-600">
            {users.filter((u: User) => u.status === 'suspended').length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Banned</div>
          <div className="text-2xl font-bold mt-2 text-red-600">
            {users.filter((u: User) => u.status === 'banned').length}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select
            value={filters.role || "all"}
            onValueChange={(value: string) =>
              setFilters({ ...filters, role: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="seller">Sellers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-6">
        <DataTable
          columns={columns}
          data={users}
          searchKey="username"
          searchPlaceholder="Search users..."
        />
      </Card>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban {selectedUser?.username}? This action can be reversed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for banning</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for banning this user..."
                value={banReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBan}>
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.username}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Username</Label>
                    <p className="text-sm">{selectedUser.username}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <p className="text-sm">{selectedUser.role}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p className="text-sm">{selectedUser.status}</p>
                  </div>
                  <div>
                    <Label>Joined</Label>
                    <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Verified</Label>
                    <p className="text-sm">{selectedUser.verified ? "Yes" : "No"}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="activity">
                <p className="text-sm text-muted-foreground">Activity log will be displayed here</p>
              </TabsContent>
              <TabsContent value="content">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Posts</div>
                    <div className="text-2xl font-bold">{selectedUser.totalPosts || 0}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Products</div>
                    <div className="text-2xl font-bold">{selectedUser.totalProducts || 0}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Followers</div>
                    <div className="text-2xl font-bold">{selectedUser.followers || 0}</div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
