"use client"
import { create } from 'zustand'

export type NotificationItem = {
  id: string
  title?: string
  body: string
  createdAt?: string
}

type NotificationState = {
  items: NotificationItem[]
  unread: number
  add: (n: NotificationItem) => void
  clear: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unread: 0,
  add: (n) => set((s) => ({ items: [n, ...s.items].slice(0, 50), unread: s.unread + 1 })),
  clear: () => set({ unread: 0 }),
}))
