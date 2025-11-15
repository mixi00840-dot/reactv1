import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Stories from '../../pages/Stories';
import axios from 'axios';

jest.mock('axios');

const mockStories = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Test User',
    userAvatar: 'https://example.com/avatar1.jpg',
    mediaUrl: 'https://example.com/story1.jpg',
    mediaType: 'image',
    thumbnail: 'https://example.com/thumb1.jpg',
    caption: 'Test story 1',
    status: 'active',
    viewsCount: 1500,
    likesCount: 250,
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Another User',
    userAvatar: 'https://example.com/avatar2.jpg',
    mediaUrl: 'https://example.com/story2.mp4',
    mediaType: 'video',
    thumbnail: 'https://example.com/thumb2.jpg',
    caption: 'Test story 2',
    status: 'flagged',
    viewsCount: 800,
    likesCount: 100,
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  }
];

describe('Stories Page', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: {
        stories: mockStories,
        totalStories: 2,
        currentPage: 1,
        totalPages: 1
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render stories page', async () => {
    render(
      <BrowserRouter>
        <Stories />
      </BrowserRouter>
    );

    expect(screen.getByText(/Stories Management/i)).toBeInTheDocument();
  });

  it('should load and display stories', async () => {
    render(
      <BrowserRouter>
        <Stories />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Another User')).toBeInTheDocument();
    });
  });

  it('should filter stories by status', async () => {
    render(
      <BrowserRouter>
        <Stories />
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

  it('should filter stories by media type', async () => {
    render(
      <BrowserRouter>
        <Stories />
      </BrowserRouter>
    );

    const typeFilter = screen.getByLabelText(/Media Type/i);
    fireEvent.change(typeFilter, { target: { value: 'video' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            mediaType: 'video'
          })
        })
      );
    });
  });

  it('should display view and like counts', async () => {
    render(
      <BrowserRouter>
        <Stories />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/1500/i)).toBeInTheDocument(); // Views
      expect(screen.getByText(/250/i)).toBeInTheDocument(); // Likes
    });
  });

  it('should show expiration time', async () => {
    render(
      <BrowserRouter>
        <Stories />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should display relative time like "Expires in 12 hours"
      expect(screen.getByText(/hours/i)).toBeInTheDocument();
    });
  });

  it('should hide story', async () => {
    axios.put.mockResolvedValue({ data: { message: 'Story hidden' } });

    render(
      <BrowserRouter>
        <Stories />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const hideButton = screen.getAllByRole('button', { name: /hide/i })[0];
    fireEvent.click(hideButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/status'),
        expect.objectContaining({ status: 'hidden' })
      );
    });
  });

  it('should flag story', async () => {
    axios.put.mockResolvedValue({ data: { message: 'Story flagged' } });

    render(
      <BrowserRouter>
        <Stories />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const flagButton = screen.getAllByRole('button', { name: /flag/i })[0];
    fireEvent.click(flagButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });
  });

  it('should delete story', async () => {
    axios.delete.mockResolvedValue({ data: { message: 'Story deleted' } });

    render(
      <BrowserRouter>
        <Stories />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
    });
  });

  it('should show media preview on click', async () => {
    render(
      <BrowserRouter>
        <Stories />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const viewButton = screen.getAllByRole('button', { name: /view|preview/i })[0];
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog') || screen.getByRole('img')).toBeInTheDocument();
    });
  });

  it('should handle expired stories', async () => {
    const expiredStories = [
      {
        ...mockStories[0],
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        status: 'expired'
      }
    ];

    axios.get.mockResolvedValue({
      data: {
        stories: expiredStories,
        totalStories: 1,
        currentPage: 1,
        totalPages: 1
      }
    });

    render(
      <BrowserRouter>
        <Stories />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/expired/i)).toBeInTheDocument();
    });
  });

  it('should display statistics summary', async () => {
    render(
      <BrowserRouter>
        <Stories />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should show total stories, total views, total likes
      expect(screen.getByText(/Total Stories/i) || screen.getByText(/2/)).toBeInTheDocument();
    });
  });
});
