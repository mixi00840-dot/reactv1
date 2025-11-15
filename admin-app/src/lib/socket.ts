"use client"
import { io, Socket } from 'socket.io-client'
import Cookies from 'js-cookie'

let socket: Socket | null = null

export function getSocket() {
  return socket
}

export function connectSocket() {
  if (socket?.connected) return socket
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL
  if (!url) return null
  const token = Cookies.get('token')
  socket = io(url, {
    transports: ['websocket'],
    auth: token ? { token: `Bearer ${token}` } : undefined,
    withCredentials: true,
  })
  socket.on('connect', () => {
    if (token) socket?.emit('authenticate', token)
  })
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
