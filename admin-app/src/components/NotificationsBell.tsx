"use client"
import { useEffect } from 'react'
import { useNotificationStore } from '@/stores/notificationStore'
import { connectSocket, getSocket } from '@/lib/socket'
import Button from '@/components/ui/button'

export default function NotificationsBell() {
  const { unread, add, clear, items } = useNotificationStore()

  useEffect(() => {
    const s = connectSocket()
    const handler = (n: any) => {
      add({ id: n._id || `${Date.now()}`, body: n.body || 'New notification', title: n.title, createdAt: n.createdAt })
    }
    getSocket()?.on('notification', handler)
    return () => {
      getSocket()?.off('notification', handler)
    }
  }, [add])

  return (
    <div className="relative">
      <Button variant="outline" size="icon" onClick={clear} aria-label="Notifications">
        🔔
      </Button>
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-xs text-destructive-foreground">
          {unread}
        </span>
      )}
    </div>
  )}
