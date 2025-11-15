import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Dashboard Stats
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard/stats');
      return data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Recent Activities
export function useRecentActivities() {
  return useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard/activities');
      return data.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

// User Growth Chart Data
export function useUserGrowthData(days: number = 30) {
  return useQuery({
    queryKey: ['dashboard', 'user-growth', days],
    queryFn: async () => {
      const { data } = await api.get(`/admin/analytics/user-growth?days=${days}`);
      return data.data;
    },
  });
}

// Revenue Chart Data
export function useRevenueData(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
  return useQuery({
    queryKey: ['dashboard', 'revenue', period],
    queryFn: async () => {
      const { data } = await api.get(`/admin/analytics/revenue?period=${period}`);
      return data.data;
    },
  });
}

// Users List
export function useUsers(page: number = 1, limit: number = 20, filters?: any) {
  return useQuery({
    queryKey: ['users', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });
      const { data } = await api.get(`/users?${params}`);
      return data.data;
    },
  });
}

// Single User
export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

// Ban User
export function useBanUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await api.post(`/admin/users/${id}/ban`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Unban User
export function useUnbanUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/admin/users/${id}/unban`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Content List
export function useContent(page: number = 1, limit: number = 20, filters?: any) {
  return useQuery({
    queryKey: ['content', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });
      const { data } = await api.get(`/content?${params}`);
      return data.data;
    },
  });
}

// Approve Content
export function useApproveContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/admin/content/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

// Reject Content
export function useRejectContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await api.post(`/admin/content/${id}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

// Products List
export function useProducts(page: number = 1, limit: number = 20, filters?: any) {
  return useQuery({
    queryKey: ['products', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });
      const { data } = await api.get(`/products?${params}`);
      return data.data;
    },
  });
}

// Orders List
export function useOrders(page: number = 1, limit: number = 20, filters?: any) {
  return useQuery({
    queryKey: ['orders', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });
      const { data } = await api.get(`/orders?${params}`);
      return data.data;
    },
  });
}

// Transactions List
export function useTransactions(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['transactions', page, limit],
    queryFn: async () => {
      const { data } = await api.get(`/transactions?page=${page}&limit=${limit}`);
      return data.data;
    },
  });
}

// System Settings
export function useSystemSettings() {
  return useQuery({
    queryKey: ['system', 'settings'],
    queryFn: async () => {
      const { data } = await api.get('/admin/settings');
      return data.data;
    },
  });
}

// Update System Settings
export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: any) => {
      const { data } = await api.put('/admin/settings', settings);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'settings'] });
    },
  });
}
