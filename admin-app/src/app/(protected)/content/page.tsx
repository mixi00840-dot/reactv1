"use client"

import { useState } from "react"
import { createContentColumns, type Content } from "@/components/content/columns"
import { useContent, useApproveContent, useRejectContent, useBanContent } from "@/hooks/use-api"
import { Card } from "@/components/ui/card"
import { Video, Eye, ThumbsUp, Flag } from "lucide-react"
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

export default function ContentPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<any>({})
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [banReason, setBanReason] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [flagReason, setFlagReason] = useState("")
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  const { toast } = useToast()
  const { data, isLoading, refetch } = useContent(page, 20, filters)
  const approveMutation = useApproveContent()
  const rejectMutation = useRejectContent()
  const banMutation = useBanContent()

  // Stats calculations
  const totalContent = data?.pagination?.total || 0
  const pendingContent = data?.contents?.filter((c: Content) => c.status === "pending").length || 0
  const flaggedContent = data?.contents?.filter((c: Content) => c.status === "flagged").length || 0
  const bannedContent = data?.contents?.filter((c: Content) => c.status === "banned").length || 0

  const handleApprove = async (content: Content) => {
    try {
      await approveMutation.mutateAsync(content._id)
      toast({
        title: "Content Approved",
        description: "The content has been approved successfully.",
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve content.",
        variant: "destructive",
      })
    }
  }

  const handleReject = (content: Content) => {
    setSelectedContent(content)
    setShowRejectDialog(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedContent) return
    try {
      await rejectMutation.mutateAsync({ id: selectedContent._id, reason: rejectReason })
      toast({
        title: "Content Rejected",
        description: "The content has been rejected.",
      })
      setShowRejectDialog(false)
      setRejectReason("")
      setSelectedContent(null)
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject content.",
        variant: "destructive",
      })
    }
  }

  const handleFlag = (content: Content) => {
    setSelectedContent(content)
    setShowFlagDialog(true)
  }

  const handleBan = (content: Content) => {
    setSelectedContent(content)
    setShowBanDialog(true)
  }

  const handleBanConfirm = async () => {
    if (!selectedContent) return
    try {
      await banMutation.mutateAsync({ id: selectedContent._id, reason: banReason })
      toast({
        title: "Content Banned",
        description: "The content has been banned.",
      })
      setShowBanDialog(false)
      setBanReason("")
      setSelectedContent(null)
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ban content.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = (content: Content) => {
    setSelectedContent(content)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedContent) return
    try {
      // Add delete API call here
      toast({
        title: "Content Deleted",
        description: "The content has been deleted.",
      })
      setShowDeleteDialog(false)
      setSelectedContent(null)
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete content.",
        variant: "destructive",
      })
    }
  }

  const handleView = (content: Content) => {
    setSelectedContent(content)
    setShowDetailsDialog(true)
  }

  const handlePreview = (content: Content) => {
    setSelectedContent(content)
    setShowPreviewDialog(true)
  }

  const columns = createContentColumns({
    onView: handleView,
    onApprove: handleApprove,
    onReject: handleReject,
    onFlag: handleFlag,
    onBan: handleBan,
    onDelete: handleDelete,
    onPreview: handlePreview,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
          <p className="text-muted-foreground">Manage and moderate user-generated content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Content</p>
              <p className="text-2xl font-bold">{totalContent}</p>
            </div>
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600">{pendingContent}</p>
            </div>
            <Eye className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Flagged</p>
              <p className="text-2xl font-bold text-red-600">{flaggedContent}</p>
            </div>
            <Flag className="h-8 w-8 text-red-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Banned</p>
              <p className="text-2xl font-bold text-gray-600">{bannedContent}</p>
            </div>
            <ThumbsUp className="h-8 w-8 text-gray-600" />
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
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="p-6">
        <DataTable
          columns={columns}
          data={data?.contents || []}
          searchKey="caption"
        />
      </Card>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban this content? This action will remove it from public view.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for banning</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for banning this content..."
                value={banReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBanConfirm}>
              Ban Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this content submission.
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
              Reject Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Content</DialogTitle>
            <DialogDescription>
              Flag this content for further review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flag-reason">Flag Reason</Label>
              <Textarea
                id="flag-reason"
                placeholder="Enter the reason for flagging..."
                value={flagReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFlagReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowFlagDialog(false)}>
              Flag Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this content? This action cannot be undone.
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

      {/* Video Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Video Preview</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black">
            {selectedContent?.videoUrl ? (
              <video
                src={selectedContent.videoUrl}
                controls
                className="h-full w-full"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex h-full items-center justify-center text-white">
                No video available
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Caption:</p>
            <p className="text-sm text-muted-foreground">{selectedContent?.caption || "No caption"}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Content Details</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="info" className="w-full">
            <TabsList>
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>Creator</Label>
                  <p className="text-sm">{selectedContent?.creator?.username || "Unknown"}</p>
                </div>
                <div>
                  <Label>Caption</Label>
                  <p className="text-sm">{selectedContent?.caption || "No caption"}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="text-sm capitalize">{selectedContent?.status}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{selectedContent?.createdAt ? new Date(selectedContent.createdAt).toLocaleString() : "N/A"}</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="stats" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>Views</Label>
                  <p className="text-2xl font-bold">{selectedContent?.views?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <Label>Likes</Label>
                  <p className="text-2xl font-bold">{selectedContent?.likes?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <Label>Comments</Label>
                  <p className="text-2xl font-bold">{selectedContent?.comments?.toLocaleString() || 0}</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="reports" className="space-y-4">
              <div>
                <Label>Total Reports</Label>
                <p className="text-2xl font-bold text-red-600">{selectedContent?.reports || 0}</p>
              </div>
              <p className="text-sm text-muted-foreground">Report details would appear here.</p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
