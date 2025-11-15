import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Transactions from '../../pages/Transactions';
import axios from 'axios';

jest.mock('axios');

const mockTransactions = [
  {
    id: '1',
    walletId: 'wallet1',
    userId: 'user1',
    userName: 'John Doe',
    type: 'credit',
    amount: 250.00,
    currency: 'USD',
    status: 'completed',
    description: 'Product sale commission',
    referenceId: 'order123',
    referenceType: 'order',
    balanceBefore: 1000.50,
    balanceAfter: 1250.50,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  },
  {
    id: '2',
    walletId: 'wallet1',
    userId: 'user1',
    userName: 'John Doe',
    type: 'debit',
    amount: 100.00,
    currency: 'USD',
    status: 'pending',
    description: 'Withdrawal request',
    referenceId: 'withdrawal456',
    referenceType: 'withdrawal',
    balanceBefore: 1250.50,
    balanceAfter: 1150.50,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    walletId: 'wallet2',
    userId: 'user2',
    userName: 'Jane Smith',
    type: 'refund',
    amount: 45.00,
    currency: 'USD',
    status: 'failed',
    description: 'Order refund',
    referenceId: 'order789',
    referenceType: 'order',
    failureReason: 'Insufficient funds',
    createdAt: new Date().toISOString(),
    failedAt: new Date().toISOString()
  }
];

describe('Transactions Page', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: {
        transactions: mockTransactions,
        totalTransactions: 3,
        totalVolume: 395.00,
        currentPage: 1,
        totalPages: 1
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render transactions page', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    expect(screen.getByText(/Transaction/i)).toBeInTheDocument();
  });

  it('should load and display transactions', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should display transaction amounts correctly formatted', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/\$250.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$100.00/)).toBeInTheDocument();
    });
  });

  it('should filter by transaction type', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    const typeFilter = screen.getByLabelText(/Type/i);
    fireEvent.change(typeFilter, { target: { value: 'credit' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            type: 'credit'
          })
        })
      );
    });
  });

  it('should filter by transaction status', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    const statusFilter = screen.getByLabelText(/Status/i);
    fireEvent.change(statusFilter, { target: { value: 'completed' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            status: 'completed'
          })
        })
      );
    });
  });

  it('should filter by date range', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    const startDateInput = screen.getByLabelText(/Start Date/i);
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

    const endDateInput = screen.getByLabelText(/End Date/i);
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

  it('should search by user name', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            search: 'John'
          })
        })
      );
    }, { timeout: 3000 });
  });

  it('should display transaction status badges', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
    });
  });

  it('should show transaction details on row click', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const row = screen.getByText('Product sale commission').closest('tr');
    fireEvent.click(row);

    await waitFor(() => {
      expect(screen.getByText(/Transaction Details/i) || screen.getByText(/Balance Before/i)).toBeInTheDocument();
    });
  });

  it('should display balance before and after', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const row = screen.getByText('Product sale commission').closest('tr');
    fireEvent.click(row);

    await waitFor(() => {
      expect(screen.getByText(/\$1,000.50/) || screen.getByText(/1000.50/)).toBeInTheDocument();
      expect(screen.getByText(/\$1,250.50/) || screen.getByText(/1250.50/)).toBeInTheDocument();
    });
  });

  it('should show failure reason for failed transactions', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    const row = screen.getByText('Order refund').closest('tr');
    fireEvent.click(row);

    await waitFor(() => {
      expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
    });
  });

  it('should display total transaction volume', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Total Volume/i) || screen.getByText(/\$395/)).toBeInTheDocument();
    });
  });

  it('should export transactions', async () => {
    const mockBlob = new Blob(['data'], { type: 'text/csv' });
    axios.get.mockResolvedValue({ data: mockBlob });

    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/export'),
        expect.any(Object)
      );
    });
  });

  it('should handle pagination', async () => {
    render(
      <BrowserRouter>
        <Transactions />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            page: 2
          })
        })
      );
    });
  });
});
