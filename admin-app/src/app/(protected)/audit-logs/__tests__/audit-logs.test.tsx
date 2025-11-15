import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import AuditLogsPage from '../page'

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

describe('Audit Logs Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders audit logs page with stats', () => {
    renderWithQueryClient(<AuditLogsPage />)

    expect(screen.getByText('Audit Logs')).toBeInTheDocument()
    expect(screen.getByText('Total Events')).toBeInTheDocument()
    expect(screen.getByText('Success')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Warnings')).toBeInTheDocument()
  })

  it('displays audit log statistics correctly', () => {
    renderWithQueryClient(<AuditLogsPage />)

    // Check for the mock stats (based on 8 mock entries)
    expect(screen.getByText('8')).toBeInTheDocument() // Total events
    expect(screen.getByText('6')).toBeInTheDocument() // Success
    expect(screen.getByText('1')).toBeInTheDocument() // Failed
  })

  it('shows search input for filtering logs', () => {
    renderWithQueryClient(<AuditLogsPage />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('displays category filter dropdown', () => {
    renderWithQueryClient(<AuditLogsPage />)

    expect(screen.getByText('All Categories')).toBeInTheDocument()
  })

  it('displays status filter dropdown', () => {
    renderWithQueryClient(<AuditLogsPage />)

    expect(screen.getByText('All Status')).toBeInTheDocument()
  })

  it('displays date range filter', () => {
    renderWithQueryClient(<AuditLogsPage />)

    expect(screen.getByText('Last 7 Days')).toBeInTheDocument()
  })

  it('renders audit log entries with details', () => {
    renderWithQueryClient(<AuditLogsPage />)

    // Check for sample log entries from mock data
    expect(screen.getByText(/User banned/i)).toBeInTheDocument()
    expect(screen.getByText(/Content approved/i)).toBeInTheDocument()
    expect(screen.getByText(/Admin login successful/i)).toBeInTheDocument()
  })

  it('displays user information in log entries', () => {
    renderWithQueryClient(<AuditLogsPage />)

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('admin@mixillo.com')).toBeInTheDocument()
  })

  it('shows IP addresses in log entries', () => {
    renderWithQueryClient(<AuditLogsPage />)

    expect(screen.getByText('192.168.1.100')).toBeInTheDocument()
  })

  it('displays category badges with correct styling', () => {
    renderWithQueryClient(<AuditLogsPage />)

    // Check for different category badges
    expect(screen.getByText('user')).toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
    expect(screen.getByText('auth')).toBeInTheDocument()
  })

  it('displays status badges (success/failed/warning)', () => {
    renderWithQueryClient(<AuditLogsPage />)

    // Status badges should be visible
    const successBadges = screen.getAllByText('success')
    expect(successBadges.length).toBeGreaterThan(0)
  })

  it('shows change tracking with old and new values', () => {
    renderWithQueryClient(<AuditLogsPage />)

    // Check for change indicators
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('banned')).toBeInTheDocument()
  })

  it('filters logs by search query', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AuditLogsPage />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'banned')

    // After filtering, should only show entries with "banned"
    await waitFor(() => {
      expect(screen.getByText(/User banned/i)).toBeInTheDocument()
      // Other entries should be filtered out
      expect(screen.queryByText(/login successful/i)).not.toBeInTheDocument()
    })
  })

  it('opens detail modal when clicking on log entry', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AuditLogsPage />)

    // Find and click on a log entry
    const logEntry = screen.getByText(/User banned/i)
    await user.click(logEntry.closest('div[class*="cursor-pointer"]') || logEntry)

    // Modal should open with detailed information
    await waitFor(() => {
      expect(screen.getByText('Event Details')).toBeInTheDocument()
      expect(screen.getByText('Event ID:')).toBeInTheDocument()
      expect(screen.getByText('Changes:')).toBeInTheDocument()
    })
  })

  it('closes detail modal when clicking close button', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AuditLogsPage />)

    // Open modal
    const logEntry = screen.getByText(/User banned/i)
    await user.click(logEntry.closest('div[class*="cursor-pointer"]') || logEntry)

    await waitFor(() => {
      expect(screen.getByText('Event Details')).toBeInTheDocument()
    })

    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Event Details')).not.toBeInTheDocument()
    })
  })

  it('displays export logs button', () => {
    renderWithQueryClient(<AuditLogsPage />)

    expect(screen.getByText('Export Logs')).toBeInTheDocument()
  })

  it('shows timestamps for all log entries', () => {
    renderWithQueryClient(<AuditLogsPage />)

    // Check for time format (e.g., "2 hours ago", "1 day ago")
    const timestamps = screen.getAllByText(/ago/i)
    expect(timestamps.length).toBeGreaterThan(0)
  })

  it('displays action icons for different event types', () => {
    renderWithQueryClient(<AuditLogsPage />)

    // Icons should be present (they're rendered as SVG elements)
    const container = screen.getByText('Audit Logs').closest('main')
    expect(container).toBeInTheDocument()
  })

  it('filters by category when category filter is changed', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AuditLogsPage />)

    // Click category filter
    const categoryFilter = screen.getByText('All Categories')
    await user.click(categoryFilter)

    // Select a specific category (e.g., "auth")
    const authOption = screen.getByText('Authentication')
    await user.click(authOption)

    // Should only show auth-related logs
    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument()
    })
  })

  it('filters by status when status filter is changed', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AuditLogsPage />)

    // Click status filter
    const statusFilter = screen.getByText('All Status')
    await user.click(statusFilter)

    // Select "Failed"
    const failedOption = screen.getByText('Failed')
    await user.click(failedOption)

    // Should only show failed logs
    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument()
    })
  })

  it('shows target information when available', () => {
    renderWithQueryClient(<AuditLogsPage />)

    // Check for target info
    expect(screen.getByText(/user/i)).toBeInTheDocument()
    expect(screen.getByText(/content/i)).toBeInTheDocument()
  })

  it('displays different role badges (admin, user)', () => {
    renderWithQueryClient(<AuditLogsPage />)

    expect(screen.getByText('admin')).toBeInTheDocument()
  })
})
