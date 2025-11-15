import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import axios from 'axios';

jest.mock('axios');

const mockDashboardData = {
  stats: {
    totalUsers: 1250,
    activeUsers: 980,
    totalSellers: 45,
    totalProducts: 342,
    totalOrders: 1567,
    pendingOrders: 23,
    totalRevenue: 45678.90,
    monthlyRevenue: 12345.67
  },
  recentUsers: [],
  recentOrders: [],
  revenueChart: []
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: mockDashboardData
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('should display statistics cards', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1250')).toBeInTheDocument(); // Total Users
      expect(screen.getByText('45')).toBeInTheDocument(); // Total Sellers
      expect(screen.getByText('342')).toBeInTheDocument(); // Total Products
    });
  });

  it('should format revenue correctly', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/45,678/i)).toBeInTheDocument();
    });
  });

  it('should load dashboard data on mount', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/dashboard'),
        expect.any(Object)
      );
    });
  });

  it('should handle loading state', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar') || screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle API errors', async () => {
    axios.get.mockRejectedValue(new Error('Failed to load dashboard'));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });
});
