import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AnalyticsPage from '../page'

// Mock Recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: () => <div data-testid="line-chart">LineChart</div>,
  AreaChart: () => <div data-testid="area-chart">AreaChart</div>,
  BarChart: () => <div data-testid="bar-chart">BarChart</div>,
  PieChart: () => <div data-testid="pie-chart">PieChart</div>,
  Line: () => null,
  Area: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}))

// Mock the custom hooks
jest.mock('@/hooks/useAnalytics', () => ({
  useDashboardStats: jest.fn(() => ({
    data: {
      totalRevenue: 125430,
      totalUsers: 15234,
      totalOrders: 8456,
      totalProducts: 1234,
      revenueGrowth: 12.5,
      usersGrowth: 8.3,
      ordersGrowth: 15.7,
      productsGrowth: 5.2,
    },
    isLoading: false,
    error: null,
  })),
  useUserGrowthData: jest.fn(() => ({
    data: [
      { date: '2024-01', users: 1200 },
      { date: '2024-02', users: 1500 },
      { date: '2024-03', users: 1800 },
    ],
    isLoading: false,
    error: null,
  })),
  useRevenueData: jest.fn(() => ({
    data: [
      { date: '2024-01', revenue: 45000 },
      { date: '2024-02', revenue: 52000 },
      { date: '2024-03', revenue: 48000 },
    ],
    isLoading: false,
    error: null,
  })),
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

const renderWithQueryClient = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={testQueryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('Analytics Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders analytics dashboard with key metrics', async () => {
    renderWithQueryClient(<AnalyticsPage />)

    // Check page title
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()

    // Check key metric cards
    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
      expect(screen.getByText('$125,430')).toBeInTheDocument()
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('15,234')).toBeInTheDocument()
      expect(screen.getByText('Total Orders')).toBeInTheDocument()
      expect(screen.getByText('8,456')).toBeInTheDocument()
      expect(screen.getByText('Total Products')).toBeInTheDocument()
      expect(screen.getByText('1,234')).toBeInTheDocument()
    })
  })

  it('displays growth percentages with correct formatting', async () => {
    renderWithQueryClient(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByText('+12.5%')).toBeInTheDocument()
      expect(screen.getByText('+8.3%')).toBeInTheDocument()
      expect(screen.getByText('+15.7%')).toBeInTheDocument()
      expect(screen.getByText('+5.2%')).toBeInTheDocument()
    })
  })

  it('renders all chart sections', async () => {
    renderWithQueryClient(<AnalyticsPage />)

    await waitFor(() => {
      // Check for chart containers
      expect(screen.getAllByTestId('area-chart')).toHaveLength(1) // User Growth
      expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThanOrEqual(1) // Revenue
      expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThanOrEqual(1) // Content Distribution
    })
  })

  it('shows date range selector', () => {
    renderWithQueryClient(<AnalyticsPage />)

    expect(screen.getByText('Last 7 Days')).toBeInTheDocument()
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument()
    expect(screen.getByText('Last 90 Days')).toBeInTheDocument()
    expect(screen.getByText('Last Year')).toBeInTheDocument()
  })

  it('displays tab navigation for different analytics sections', () => {
    renderWithQueryClient(<AnalyticsPage />)

    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('handles loading state', () => {
    const { useDashboardStats } = require('@/hooks/useAnalytics')
    useDashboardStats.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    })

    renderWithQueryClient(<AnalyticsPage />)

    // Should show loading indicators
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('handles error state', async () => {
    const { useDashboardStats } = require('@/hooks/useAnalytics')
    useDashboardStats.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch analytics data'),
    })

    renderWithQueryClient(<AnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
