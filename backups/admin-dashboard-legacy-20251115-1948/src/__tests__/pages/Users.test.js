import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Users from '../../pages/Users';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({ uid: 'test-admin-id', email: 'admin@test.com' });
    return jest.fn();
  })
}));

const mockUsers = [
  {
    id: '1',
    email: 'user1@example.com',
    username: 'user1',
    displayName: 'User One',
    role: 'user',
    status: 'active',
    isVerified: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'user2@example.com',
    username: 'user2',
    displayName: 'User Two',
    role: 'seller',
    status: 'active',
    isVerified: true,
    createdAt: new Date().toISOString()
  }
];

describe('Users Page', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: {
        users: mockUsers,
        totalUsers: 2,
        currentPage: 1,
        totalPages: 1
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render users page', async () => {
    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    );

    expect(screen.getByText(/User Management/i)).toBeInTheDocument();
  });

  it('should load and display users', async () => {
    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });
  });

  it('should filter users by status', async () => {
    render(
      <BrowserRouter>
        <Users />
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

  it('should filter users by role', async () => {
    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    );

    const roleFilter = screen.getByLabelText(/Role/i);
    fireEvent.change(roleFilter, { target: { value: 'seller' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            role: 'seller'
          })
        })
      );
    });
  });

  it('should search users', async () => {
    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'user1' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            search: 'user1'
          })
        })
      );
    }, { timeout: 3000 });
  });

  it('should handle pagination', async () => {
    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    const nextPageButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextPageButton);

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

  it('should handle user actions', async () => {
    axios.put.mockResolvedValue({ data: { message: 'User banned successfully' } });

    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    const actionsButton = screen.getAllByRole('button', { name: /actions/i })[0];
    fireEvent.click(actionsButton);

    const banButton = screen.getByText(/Ban/i);
    fireEvent.click(banButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
