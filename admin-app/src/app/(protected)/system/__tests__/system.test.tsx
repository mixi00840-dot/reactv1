import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import SystemSettingsPage from '../page'

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock the settings hooks
jest.mock('@/hooks/useSettings', () => ({
  useSystemSettings: jest.fn(() => ({
    data: {
      general: {
        siteName: 'Mixillo',
        siteDescription: 'Social commerce platform',
        supportEmail: 'support@mixillo.com',
        maintenanceMode: false,
      },
      payment: {
        stripeEnabled: true,
        stripePublicKey: 'pk_test_123',
        stripeSecretKey: 'sk_test_123',
        paypalEnabled: false,
        currency: 'USD',
        commissionRate: 10,
      },
      content: {
        maxVideoSize: 100,
        maxVideoDuration: 300,
        allowedFormats: ['mp4', 'mov', 'avi'],
        autoModeration: true,
        moderationThreshold: 0.7,
      },
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        soundEnabled: true,
      },
      storage: {
        provider: 'cloudinary',
        cloudinaryCloudName: 'mixillo',
        cloudinaryApiKey: '123456',
      },
      security: {
        jwtExpiration: '1h',
        maxLoginAttempts: 5,
        sessionTimeout: 3600,
        passwordMinLength: 8,
        twoFactorEnabled: false,
      },
    },
    isLoading: false,
    error: null,
  })),
  useUpdateSystemSettings: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
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

describe('System Settings Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders system settings page with all sections', () => {
    renderWithQueryClient(<SystemSettingsPage />)

    expect(screen.getByText('System Settings')).toBeInTheDocument()
    expect(screen.getByText('System Status')).toBeInTheDocument()
  })

  it('displays system status cards', async () => {
    renderWithQueryClient(<SystemSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Database')).toBeInTheDocument()
      expect(screen.getByText('Redis Cache')).toBeInTheDocument()
      expect(screen.getByText('CDN Storage')).toBeInTheDocument()
      expect(screen.getByText('API Server')).toBeInTheDocument()
    })
  })

  it('renders all configuration tabs', () => {
    renderWithQueryClient(<SystemSettingsPage />)

    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Payment')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Storage')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
  })

  it('displays general settings values', async () => {
    renderWithQueryClient(<SystemSettingsPage />)

    await waitFor(() => {
      const siteNameInput = screen.getByDisplayValue('Mixillo')
      expect(siteNameInput).toBeInTheDocument()

      const emailInput = screen.getByDisplayValue('support@mixillo.com')
      expect(emailInput).toBeInTheDocument()
    })
  })

  it('allows editing site name in general settings', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<SystemSettingsPage />)

    await waitFor(() => {
      const siteNameInput = screen.getByDisplayValue('Mixillo')
      expect(siteNameInput).toBeInTheDocument()
    })

    const siteNameInput = screen.getByDisplayValue('Mixillo')
    await user.clear(siteNameInput)
    await user.type(siteNameInput, 'New Site Name')

    expect(siteNameInput).toHaveValue('New Site Name')
  })

  it('switches between tabs correctly', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<SystemSettingsPage />)

    // Click Payment tab
    const paymentTab = screen.getByText('Payment')
    await user.click(paymentTab)

    await waitFor(() => {
      expect(screen.getByText('Stripe Configuration')).toBeInTheDocument()
      expect(screen.getByText('Currency')).toBeInTheDocument()
      expect(screen.getByText('Commission Rate')).toBeInTheDocument()
    })
  })

  it('displays payment settings when Payment tab is selected', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<SystemSettingsPage />)

    const paymentTab = screen.getByText('Payment')
    await user.click(paymentTab)

    await waitFor(() => {
      expect(screen.getByDisplayValue('pk_test_123')).toBeInTheDocument()
      expect(screen.getByText('USD')).toBeInTheDocument()
    })
  })

  it('displays content moderation settings', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<SystemSettingsPage />)

    const contentTab = screen.getByText('Content')
    await user.click(contentTab)

    await waitFor(() => {
      expect(screen.getByText('Max Video Size (MB)')).toBeInTheDocument()
      expect(screen.getByText('Max Video Duration (seconds)')).toBeInTheDocument()
      expect(screen.getByText('Auto Moderation')).toBeInTheDocument()
    })
  })

  it('shows notification toggles', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<SystemSettingsPage />)

    const notificationsTab = screen.getByText('Notifications')
    await user.click(notificationsTab)

    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument()
      expect(screen.getByText('Push Notifications')).toBeInTheDocument()
      expect(screen.getByText('SMS Notifications')).toBeInTheDocument()
      expect(screen.getByText('Sound Notifications')).toBeInTheDocument()
    })
  })

  it('displays security settings', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<SystemSettingsPage />)

    const securityTab = screen.getByText('Security')
    await user.click(securityTab)

    await waitFor(() => {
      expect(screen.getByText('JWT Token Expiration')).toBeInTheDocument()
      expect(screen.getByText('Max Login Attempts')).toBeInTheDocument()
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument()
    })
  })

  it('has save buttons for each configuration section', async () => {
    renderWithQueryClient(<SystemSettingsPage />)

    // Should have save button in General tab (default)
    expect(screen.getByText('Save General Settings')).toBeInTheDocument()
  })

  it('handles loading state', () => {
    const { useSystemSettings } = require('@/hooks/useSettings')
    useSystemSettings.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    })

    renderWithQueryClient(<SystemSettingsPage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('handles error state', async () => {
    const { useSystemSettings } = require('@/hooks/useSettings')
    useSystemSettings.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load settings'),
    })

    renderWithQueryClient(<SystemSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
