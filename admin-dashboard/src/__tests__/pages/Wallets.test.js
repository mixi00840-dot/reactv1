import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Wallets from '../../pages/Wallets';
import axios from 'axios';

jest.mock('axios');

const mockWallets = [
  {
    id: '1',
    userId: 'user1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    balance: 1250.50,
    currency: 'USD',
    status: 'active',
    totalEarnings: 5000.00,
    totalWithdrawals: 3749.50,
    pendingBalance: 100.00,
    availableBalance: 1150.50,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Jane Smith',
    userEmail: 'jane@example.com',
    balance: 850.00,
    currency: 'USD',
    status: 'frozen',
    totalEarnings: 2000.00,
    totalWithdrawals: 1150.00,
    pendingBalance: 0,
    availableBalance: 850.00,
    freezeReason: 'Under review',
    createdAt: new Date().toISOString()
  }
];

describe('Wallets Page', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: {
        wallets: mockWallets,
        totalWallets: 2,
        totalBalance: 2100.50,
        currentPage: 1,
        totalPages: 1
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render wallets page', async () => {
    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    expect(screen.getByText(/Wallet Management/i)).toBeInTheDocument();
  });

  it('should load and display wallets', async () => {
    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should display balance correctly formatted', async () => {
    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/\$1,250.50/)).toBeInTheDocument();
      expect(screen.getByText(/\$850.00/)).toBeInTheDocument();
    });
  });

  it('should filter wallets by status', async () => {
    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    const statusFilter = screen.getByLabelText(/Status/i);
    fireEvent.change(statusFilter, { target: { value: 'active' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            status: 'active'
          })
        })
      );
    });
  });

  it('should filter by minimum balance', async () => {
    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    const minBalanceInput = screen.getByLabelText(/Min Balance/i);
    fireEvent.change(minBalanceInput, { target: { value: '1000' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            minBalance: '1000'
          })
        })
      );
    }, { timeout: 3000 });
  });

  it('should search wallets by user', async () => {
    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'john@example.com' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            search: 'john@example.com'
          })
        })
      );
    }, { timeout: 3000 });
  });

  it('should adjust wallet balance', async () => {
    axios.put.mockResolvedValue({ data: { message: 'Balance adjusted' } });

    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const adjustButton = screen.getAllByRole('button', { name: /adjust/i })[0];
    fireEvent.click(adjustButton);

    // Fill adjustment form
    await waitFor(() => {
      const amountInput = screen.getByLabelText(/Amount/i);
      fireEvent.change(amountInput, { target: { value: '50' } });
    });

    const submitButton = screen.getByRole('button', { name: /submit|confirm/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });
  });

  it('should freeze wallet', async () => {
    axios.put.mockResolvedValue({ data: { message: 'Wallet frozen' } });

    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const freezeButton = screen.getAllByRole('button', { name: /freeze/i })[0];
    fireEvent.click(freezeButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/freeze'),
        expect.any(Object)
      );
    });
  });

  it('should unfreeze wallet', async () => {
    axios.put.mockResolvedValue({ data: { message: 'Wallet unfrozen' } });

    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    const unfreezeButton = screen.getAllByRole('button', { name: /unfreeze/i })[0];
    fireEvent.click(unfreezeButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/unfreeze'),
        expect.any(Object)
      );
    });
  });

  it('should display total statistics', async () => {
    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Total Balance/i)).toBeInTheDocument();
      expect(screen.getByText(/\$2,100.50/)).toBeInTheDocument();
    });
  });

  it('should show wallet details on row click', async () => {
    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const row = screen.getByText('John Doe').closest('tr');
    fireEvent.click(row);

    await waitFor(() => {
      expect(screen.getByText(/Wallet Details/i) || screen.getByText(/Total Earnings/i)).toBeInTheDocument();
    });
  });

  it('should display freeze reason for frozen wallets', async () => {
    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Under review')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <Wallets />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });
});
