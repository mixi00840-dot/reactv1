import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UploadManager from '../../pages/UploadManager';
import axios from 'axios';

jest.mock('axios');

const mockUploads = [
  {
    id: '1',
    type: 'id',
    status: 'pending',
    userId: 'user1',
    userName: 'Test User',
    fileName: 'id-card.jpg',
    fileUrl: 'https://example.com/id-card.jpg',
    fileSize: 1024000,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    type: 'passport',
    status: 'approved',
    userId: 'user2',
    userName: 'Test User 2',
    fileName: 'passport.jpg',
    fileUrl: 'https://example.com/passport.jpg',
    fileSize: 2048000,
    createdAt: new Date().toISOString()
  }
];

describe('UploadManager Page', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: {
        uploads: mockUploads,
        totalUploads: 2,
        currentPage: 1,
        totalPages: 1
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render upload manager', async () => {
    render(
      <BrowserRouter>
        <UploadManager />
      </BrowserRouter>
    );

    expect(screen.getByText(/Upload Manager/i)).toBeInTheDocument();
  });

  it('should load and display uploads', async () => {
    render(
      <BrowserRouter>
        <UploadManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('id-card.jpg')).toBeInTheDocument();
      expect(screen.getByText('passport.jpg')).toBeInTheDocument();
    });
  });

  it('should filter uploads by type', async () => {
    render(
      <BrowserRouter>
        <UploadManager />
      </BrowserRouter>
    );

    const typeFilter = screen.getByLabelText(/Type/i);
    fireEvent.change(typeFilter, { target: { value: 'id' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            type: 'id'
          })
        })
      );
    });
  });

  it('should filter uploads by status', async () => {
    render(
      <BrowserRouter>
        <UploadManager />
      </BrowserRouter>
    );

    const statusFilter = screen.getByLabelText(/Status/i);
    fireEvent.change(statusFilter, { target: { value: 'pending' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            status: 'pending'
          })
        })
      );
    });
  });

  it('should approve upload', async () => {
    axios.put.mockResolvedValue({ data: { message: 'Upload approved' } });

    render(
      <BrowserRouter>
        <UploadManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('id-card.jpg')).toBeInTheDocument();
    });

    const approveButton = screen.getAllByRole('button', { name: /approve/i })[0];
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/approve'),
        expect.any(Object)
      );
    });
  });

  it('should reject upload', async () => {
    axios.put.mockResolvedValue({ data: { message: 'Upload rejected' } });

    render(
      <BrowserRouter>
        <UploadManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('id-card.jpg')).toBeInTheDocument();
    });

    const rejectButton = screen.getAllByRole('button', { name: /reject/i })[0];
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/reject'),
        expect.any(Object)
      );
    });
  });

  it('should display file preview', async () => {
    render(
      <BrowserRouter>
        <UploadManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('id-card.jpg')).toBeInTheDocument();
    });

    const viewButton = screen.getAllByRole('button', { name: /view/i })[0];
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByRole('img') || screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should format file size correctly', async () => {
    render(
      <BrowserRouter>
        <UploadManager />
      </BrowserRouter>
    );

    await waitFor(() => {
      // 1024000 bytes = ~1 MB
      expect(screen.getByText(/1(\.\d+)?\s*MB/i)).toBeInTheDocument();
    });
  });
});
