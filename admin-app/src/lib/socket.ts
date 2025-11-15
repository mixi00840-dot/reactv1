"use client"

import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { toast } from '@/hooks/use-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  connect() {
    const token = Cookies.get('token');

    if (!token) {
      console.warn('⚠️ No auth token found, skipping socket connection');
      return;
    }

    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      withCredentials: true,
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      
      // Authenticate
      this.socket?.emit('authenticate', Cookies.get('token'));
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: 'Unable to connect to real-time updates',
        });
      }
    });

    this.socket.on('authenticated', () => {
      console.log('✅ Socket authenticated');
    });

    this.socket.on('auth_error', (data) => {
      console.error('❌ Socket auth error:', data);
    });
  }

  on(event: string, callback: Function) {
    if (!this.socket) {
      console.warn('⚠️ Socket not connected');
      return;
    }

    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(callback);

    this.socket.on(event, (...args: any[]) => callback(...args));
  }

  off(event: string, callback?: Function) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback as any);
      this.eventHandlers.get(event)?.delete(callback);
    } else {
      this.socket.off(event);
      this.eventHandlers.delete(event);
    }
  }

  emit(event: string, data?: any) {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket not connected, cannot emit:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  joinRoom(room: string) {
    this.emit('join:room', room);
  }

  leaveRoom(room: string) {
    this.emit('leave:room', room);
  }

  disconnect() {
    if (this.socket) {
      this.eventHandlers.forEach((handlers, event) => {
        this.socket?.off(event);
      });
      this.eventHandlers.clear();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
let socketService: SocketService | null = null;

export const getSocketService = (): SocketService => {
  if (!socketService) {
    socketService = new SocketService();
  }
  return socketService;
};

// Legacy exports for backward compatibility
export function getSocket() {
  return getSocketService().getSocket();
}

export function connectSocket() {
  return getSocketService().connect();
}

export function disconnectSocket() {
  getSocketService().disconnect();
}

export default getSocketService;
