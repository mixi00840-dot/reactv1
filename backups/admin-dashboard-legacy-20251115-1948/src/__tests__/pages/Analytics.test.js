import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Analytics from '../../pages/Analytics';
import axios from 'axios';

jest.mock('axios');

const mockAnalyticsData = {
  overview: {
    totalUsers: 15420,
    totalRevenue: 245680.50,
    totalOrders: 8934,
    averageOrderValue: 27.50,
    conversionRate: 3.2,
    topSellingProducts: 456,
    activeSellers: 342
  },
  userMetrics: {
    newUsers: 1234,
    activeUsers: 8456,
    retention: 68.5,
    growth: 12.3,
    chartData: [
      { date: '2024-01-01', users: 100, active: 80 },
      { date: '2024-01-02', users: 120, active: 95 }
    ]
  },
  revenueMetrics: {
    daily: 8234.50,
    weekly: 45678.00,
    monthly: 189234.50,
    chartData: [
      { date: '2024-01-01', revenue: 5000, orders: 100 },
      { date: '2024-01-02', revenue: 5500, orders: 110 }
    ]
  },
  productMetrics: {
    topProducts: [
      { id: '1', name: 'Product A', sales: 234, revenue: 12345.00 },
      { id: '2', name: 'Product B', sales: 189, revenue: 9876.00 }
    ],
    categories: [
      { name: 'Electronics', products: 145, revenue: 56789.00 },
      { name: 'Fashion', products: 234, revenue: 45678.00 }
    ]
  },
  orderMetrics: {
    pending: 45,
    processing: 123,
    completed: 8456,
    cancelled: 310,
    trends: [
      { date: '2024-01-01', count: 100, value: 2500 },
      { date: '2024-01-02', count: 110, value: 2750 }
    ]
  },
  sellerMetrics: {
    topSellers: [
      { id: '1', name: 'Seller A', sales: 456, revenue: 23456.00, rating: 4.8 },
      { id: '2', name: 'Seller B', sales: 345, revenue: 18765.00, rating: 4.6 }
    ],
    averageRating: 4.5,
    totalCommission: 12345.50
  },
  engagement: {
    dau: 5678,
    mau: 12345,
    averageSessionTime: 8.5,
    pageViews: 45678,
    bounceRate: 32.5
  }
};

describe('Analytics Page', () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/overview')) {
        return Promise.resolve({ data: mockAnalyticsData.overview });
      } else if (url.includes('/users')) {
        return Promise.resolve({ data: mockAnalyticsData.userMetrics });
      } else if (url.includes('/revenue')) {
        return Promise.resolve({ data: mockAnalyticsData.revenueMetrics });
      } else if (url.includes('/products')) {
        return Promise.resolve({ data: mockAnalyticsData.productMetrics });
      } else if (url.includes('/orders')) {
        return Promise.resolve({ data: mockAnalyticsData.orderMetrics });
      } else if (url.includes('/sellers')) {
        return Promise.resolve({ data: mockAnalyticsData.sellerMetrics });
      } else if (url.includes('/engagement')) {
        return Promise.resolve({ data: mockAnalyticsData.engagement });
      }
      return Promise.resolve({ data: mockAnalyticsData });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render analytics page', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    expect(screen.getByText(/Analytics/i) || screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('should display overview statistics', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/15,420/) || screen.getByText(/15420/)).toBeInTheDocument(); // Total Users
      expect(screen.getByText(/245,680/) || screen.getByText(/\$245,680/)).toBeInTheDocument(); // Total Revenue
    });
  });

  it('should filter data by date range', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    const startDateInput = screen.getByLabelText(/Start Date/i) || screen.getAllByRole('textbox')[0];
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

    const endDateInput = screen.getByLabelText(/End Date/i) || screen.getAllByRole('textbox')[1];
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            startDate: expect.any(String),
            endDate: expect.any(String)
          })
        })
      );
    });
  });

  it('should display user growth chart', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/User Growth/i) || screen.getByText(/New Users/i)).toBeInTheDocument();
    });
  });

  it('should display revenue chart', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Revenue/i)).toBeInTheDocument();
      expect(screen.getByText(/\$8,234/) || screen.getByText(/Daily/i)).toBeInTheDocument();
    });
  });

  it('should show top selling products', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Product A') || screen.getByText(/Top Products/i)).toBeInTheDocument();
    });
  });

  it('should display order statistics', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/45/) && screen.getByText(/Pending/i)).toBeInTheDocument();
      expect(screen.getByText(/8,456/) || screen.getByText(/8456/)).toBeInTheDocument(); // Completed
    });
  });

  it('should show top sellers', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Seller A') || screen.getByText(/Top Sellers/i)).toBeInTheDocument();
    });
  });

  it('should display engagement metrics', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/5,678/) || screen.getByText(/DAU/i)).toBeInTheDocument();
      expect(screen.getByText(/12,345/) || screen.getByText(/MAU/i)).toBeInTheDocument();
    });
  });

  it('should export data as CSV', async () => {
    const mockBlob = new Blob(['data'], { type: 'text/csv' });
    axios.get.mockResolvedValue({ data: mockBlob });

    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export|download/i });
      fireEvent.click(exportButton);
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/export'),
        expect.objectContaining({
          params: expect.objectContaining({ format: 'csv' })
        })
      );
    });
  });

  it('should export data as JSON', async () => {
    axios.get.mockResolvedValue({ data: mockAnalyticsData });

    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export|download/i });
      fireEvent.click(exportButton);
    });

    const jsonOption = screen.getByText(/JSON/i);
    fireEvent.click(jsonOption);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/export'),
        expect.objectContaining({
          params: expect.objectContaining({ format: 'json' })
        })
      );
    });
  });

  it('should toggle between different metric views', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    const revenueTab = screen.getByRole('tab', { name: /Revenue/i }) || screen.getByText(/Revenue/i);
    fireEvent.click(revenueTab);

    await waitFor(() => {
      expect(screen.getByText(/Daily Revenue/i) || screen.getByText(/\$8,234/)).toBeInTheDocument();
    });
  });

  it('should refresh data on button click', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/15,420/)).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2); // Initial + refresh
    });
  });

  it('should display conversion rate', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/3.2%/) || screen.getByText(/Conversion/i)).toBeInTheDocument();
    });
  });

  it('should show average order value', async () => {
    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/\$27.50/) || screen.getByText(/Average Order/i)).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar') || screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle API errors', async () => {
    axios.get.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });
});
