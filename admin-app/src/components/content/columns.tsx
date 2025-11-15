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
import { MoreHorizontal, Eye, CheckCircle, XCircle, Flag, Trash2, Play } from "lucide-react"

// Content type definition
export type Content = {
  _id: string
  videoUrl?: string
  thumbnail?: string
  caption?: string
  creator?: {
    _id: string
    username: string
    avatar?: string
  }
  status: "pending" | "active" | "inactive" | "flagged" | "banned" | "deleted"
  views?: number
  likes?: number
  comments?: number
  reports?: number
  createdAt: string
  updatedAt?: string
}

// Column action handlers interface
export interface ColumnActions {
  onView: (content: Content) => void
  onApprove: (content: Content) => void
  onReject: (content: Content) => void
  onFlag: (content: Content) => void
  onBan: (content: Content) => void
  onDelete: (content: Content) => void
  onPreview: (content: Content) => void
}

// Status badge color mapping
const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  active: "default",
  inactive: "secondary",
  flagged: "destructive",
  banned: "destructive",
  deleted: "secondary",
}

export const createContentColumns = (actions: ColumnActions): ColumnDef<Content>[] => [
  {
    accessorKey: "creator",
    header: "Creator",
    cell: ({ row }) => {
      const creator = row.original.creator
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={creator?.avatar} alt={creator?.username} />
            <AvatarFallback>{creator?.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{creator?.username || "Unknown"}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "caption",
    header: "Caption",
    cell: ({ row }) => {
      const caption = row.original.caption || ""
      return (
        <div className="max-w-[300px]">
          <p className="truncate text-sm">{caption || <span className="text-muted-foreground">No caption</span>}</p>
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
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "views",
    header: "Views",
    cell: ({ row }) => {
      return <span className="text-sm">{row.original.views?.toLocaleString() || 0}</span>
    },
  },
  {
    accessorKey: "likes",
    header: "Likes",
    cell: ({ row }) => {
      return <span className="text-sm">{row.original.likes?.toLocaleString() || 0}</span>
    },
  },
  {
    accessorKey: "reports",
    header: "Reports",
    cell: ({ row }) => {
      const reports = row.original.reports || 0
      return (
        <span className={`text-sm font-medium ${reports > 0 ? "text-red-600" : ""}`}>
          {reports > 0 ? (
            <span className="flex items-center gap-1">
              <Flag className="h-3 w-3" />
              {reports}
            </span>
          ) : (
            0
          )}
        </span>
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
      const content = row.original

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
            <DropdownMenuItem onClick={() => actions.onPreview(content)}>
              <Play className="mr-2 h-4 w-4" />
              Preview Video
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onView(content)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {content.status === "pending" && (
              <>
                <DropdownMenuItem onClick={() => actions.onApprove(content)} className="text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.onReject(content)} className="text-red-600">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
            {content.status === "active" && (
              <DropdownMenuItem onClick={() => actions.onFlag(content)} className="text-orange-600">
                <Flag className="mr-2 h-4 w-4" />
                Flag Content
              </DropdownMenuItem>
            )}
            {(content.status === "flagged" || content.status === "active") && (
              <DropdownMenuItem onClick={() => actions.onBan(content)} className="text-red-600">
                <XCircle className="mr-2 h-4 w-4" />
                Ban Content
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => actions.onDelete(content)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
