"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Ban, CheckCircle, Edit, Trash2, Eye, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type User = {
  _id: string
  username: string
  email: string
  role: "user" | "seller" | "admin"
  status: "active" | "suspended" | "banned"
  verified: boolean
  avatar?: string
  createdAt: string
  totalPosts?: number
  totalProducts?: number
  followers?: number
}

interface ColumnActions {
  onView: (user: User) => void
  onEdit: (user: User) => void
  onBan: (user: User) => void
  onUnban: (user: User) => void
  onDelete: (user: User) => void
  onVerify: (user: User) => void
}

export function createUserColumns(actions: ColumnActions): ColumnDef<User>[] {
  return [
    {
      accessorKey: "username",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            User
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium flex items-center gap-2">
                {user.username}
                {user.verified && (
                  <Shield className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        const colors = {
          admin: "bg-purple-100 text-purple-800 border-purple-200",
          seller: "bg-blue-100 text-blue-800 border-blue-200",
          user: "bg-gray-100 text-gray-800 border-gray-200",
        }
        return (
          <Badge variant="outline" className={colors[role as keyof typeof colors]}>
            {role.toUpperCase()}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const colors = {
          active: "bg-green-100 text-green-800 border-green-200",
          suspended: "bg-yellow-100 text-yellow-800 border-yellow-200",
          banned: "bg-red-100 text-red-800 border-red-200",
        }
        return (
          <Badge variant="outline" className={colors[status as keyof typeof colors]}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "totalPosts",
      header: "Posts",
      cell: ({ row }) => {
        return <div className="text-center">{row.getValue("totalPosts") || 0}</div>
      },
    },
    {
      accessorKey: "totalProducts",
      header: "Products",
      cell: ({ row }) => {
        return <div className="text-center">{row.getValue("totalProducts") || 0}</div>
      },
    },
    {
      accessorKey: "followers",
      header: "Followers",
      cell: ({ row }) => {
        return <div className="text-center">{row.getValue("followers") || 0}</div>
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Joined
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString()
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original

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
              <DropdownMenuItem onClick={() => actions.onView(user)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              {!user.verified && (
                <DropdownMenuItem onClick={() => actions.onVerify(user)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify User
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {user.status === "banned" ? (
                <DropdownMenuItem onClick={() => actions.onUnban(user)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Unban User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => actions.onBan(user)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Ban User
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => actions.onDelete(user)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
