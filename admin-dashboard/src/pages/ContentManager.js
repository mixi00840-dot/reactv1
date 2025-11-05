import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/apiFirebase';
import './ContentManager.css';

const ContentManager = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all',
    sortBy: 'createdAt',
    order: 'desc',
    page: 1,
    limit: 20
  });
  const [selectedContent, setSelectedContent] = useState([]);
  const [showPreview, setShowPreview] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    pending: 0,
    flagged: 0
  });

  useEffect(() => {
    fetchContent();
    fetchStats();
  }, [filters]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== 'all' && value !== '') {
          params.append(key, value);
        }
      });
      const payload = await api.get(`/api/moderation/queue?${params}`);
      setContent(payload?.items || []);
      setStats(prev => ({ ...prev, total: payload?.total || 0 }));
      
    } catch (error) {
      console.error('Error fetching content:', error);
      alert('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const payload = await api.get('/api/analytics/content');
      setStats(payload);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (contentId) => {
    try {
      await api.post(`/api/moderation/approve/${contentId}`, { notes: 'Approved via bulk action' });
      
      fetchContent();
      alert('Content approved');
    } catch (error) {
      console.error('Error approving content:', error);
      alert('Failed to approve content');
    }
  };

  const handleReject = async (contentId, reason) => {
    const rejectReason = reason || prompt('Enter rejection reason:');
    if (!rejectReason) return;
    
    try {
      await api.post(`/api/moderation/reject/${contentId}`, { 
        reason: rejectReason,
        action: 'takedown'
      });
      
      fetchContent();
      alert('Content rejected');
    } catch (error) {
      console.error('Error rejecting content:', error);
      alert('Failed to reject content');
    }
  };

  const handleFeature = async (contentId) => {
    try {
      await api.post(`/api/trending/feature/${contentId}`, { featured: true, priority: 5 });
      
      fetchContent();
      alert('Content featured');
    } catch (error) {
      console.error('Error featuring content:', error);
      alert('Failed to feature content');
    }
  };

  const handlePin = async (contentId) => {
    try {
      await api.post(`/api/trending/pin/${contentId}`, { pinned: true, position: 1 });
      
      fetchContent();
      alert('Content pinned');
    } catch (error) {
      console.error('Error pinning content:', error);
      alert('Failed to pin content');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedContent.length === 0) {
      alert('No content selected');
      return;
    }
    
    if (!window.confirm(`${action} ${selectedContent.length} items?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      for (const contentId of selectedContent) {
        if (action === 'approve') {
          await handleApprove(contentId);
        } else if (action === 'reject') {
          await handleReject(contentId, 'Bulk rejection');
        } else if (action === 'feature') {
          await handleFeature(contentId);
        }
      }
      
      setSelectedContent([]);
      fetchContent();
      alert(`${action} completed for ${selectedContent.length} items`);
      
    } catch (error) {
      console.error('Error with bulk action:', error);
      alert('Bulk action failed');
    }
  };

  const toggleSelect = (contentId) => {
    setSelectedContent(prev => 
      prev.includes(contentId)
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const selectAll = () => {
    if (selectedContent.length === content.length) {
      setSelectedContent([]);
    } else {
      setSelectedContent(content.map(item => item._id));
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  return (
    <div className="content-manager">
      <div className="header">
        <h1>Content Management</h1>
        <button 
          className="btn-primary"
          onClick={() => navigate('/admin/content/upload')}
        >
          Upload Content
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{formatNumber(stats.total)}</div>
          <div className="stat-label">Total Videos</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{formatNumber(stats.published)}</div>
          <div className="stat-label">Published</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{formatNumber(stats.pending)}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-value">{formatNumber(stats.flagged)}</div>
          <div className="stat-label">Flagged</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search by title, creator, hashtag..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
          className="search-input"
        />
        
        <select 
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
          <option value="removed">Removed</option>
        </select>
        
        <select 
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value, page: 1})}
        >
          <option value="all">All Categories</option>
          <option value="entertainment">Entertainment</option>
          <option value="education">Education</option>
          <option value="sports">Sports</option>
          <option value="music">Music</option>
          <option value="comedy">Comedy</option>
        </select>
        
        <select 
          value={filters.sortBy}
          onChange={(e) => setFilters({...filters, sortBy: e.target.value, page: 1})}
        >
          <option value="createdAt">Latest</option>
          <option value="views">Most Viewed</option>
          <option value="likes">Most Liked</option>
          <option value="reports">Most Reported</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedContent.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedContent.length} selected</span>
          <button onClick={() => handleBulkAction('approve')} className="btn-success">
            Approve All
          </button>
          <button onClick={() => handleBulkAction('reject')} className="btn-danger">
            Reject All
          </button>
          <button onClick={() => handleBulkAction('feature')} className="btn-warning">
            Feature All
          </button>
          <button onClick={() => setSelectedContent([])} className="btn-secondary">
            Clear
          </button>
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div className="loading">Loading content...</div>
      ) : (
        <>
          <div className="content-header">
            <input 
              type="checkbox"
              checked={selectedContent.length === content.length && content.length > 0}
              onChange={selectAll}
            />
            <span>Select All</span>
          </div>
          
          <div className="content-grid">
            {content.map((item) => (
              <div key={item._id} className={`content-card ${selectedContent.includes(item._id) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedContent.includes(item._id)}
                  onChange={() => toggleSelect(item._id)}
                  className="content-checkbox"
                />
                
                <div className="content-thumbnail" onClick={() => setShowPreview(item)}>
                  <img src={item.thumbnailUrl} alt={item.title} />
                  <div className="duration-badge">{formatDuration(item.duration)}</div>
                  {item.status === 'flagged' && <div className="flagged-badge">⚠️</div>}
                </div>
                
                <div className="content-info">
                  <h3>{item.title}</h3>
                  <p className="creator">@{item.creator?.username}</p>
                  
                  <div className="content-stats">
                    <span>👁️ {formatNumber(item.metrics?.views || 0)}</span>
                    <span>❤️ {formatNumber(item.metrics?.likes || 0)}</span>
                    <span>💬 {formatNumber(item.metrics?.comments || 0)}</span>
                  </div>
                  
                  <div className="content-tags">
                    {item.hashtags?.slice(0, 3).map((tag, i) => (
                      <span key={i} className="tag">#{tag}</span>
                    ))}
                  </div>
                  
                  <div className="content-actions">
                    <button 
                      onClick={() => handleApprove(item._id)}
                      className="btn-icon btn-success"
                      title="Approve"
                    >
                      ✓
                    </button>
                    <button 
                      onClick={() => handleReject(item._id)}
                      className="btn-icon btn-danger"
                      title="Reject"
                    >
                      ✗
                    </button>
                    <button 
                      onClick={() => handleFeature(item._id)}
                      className="btn-icon btn-warning"
                      title="Feature"
                    >
                      ⭐
                    </button>
                    <button 
                      onClick={() => handlePin(item._id)}
                      className="btn-icon btn-info"
                      title="Pin"
                    >
                      📌
                    </button>
                    <button 
                      onClick={() => navigate(`/admin/content/${item._id}`)}
                      className="btn-icon btn-secondary"
                      title="Details"
                    >
                      📊
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button 
              disabled={filters.page === 1}
              onClick={() => setFilters({...filters, page: filters.page - 1})}
            >
              Previous
            </button>
            <span>Page {filters.page}</span>
            <button 
              disabled={content.length < filters.limit}
              onClick={() => setFilters({...filters, page: filters.page + 1})}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPreview(null)}>×</button>
            <h2>{showPreview.title}</h2>
            <video 
              src={showPreview.videoUrl} 
              controls 
              autoPlay
              className="preview-video"
            />
            <div className="preview-info">
              <p><strong>Creator:</strong> @{showPreview.creator?.username}</p>
              <p><strong>Duration:</strong> {formatDuration(showPreview.duration)}</p>
              <p><strong>Status:</strong> {showPreview.status}</p>
              <p><strong>Category:</strong> {showPreview.category}</p>
              <p><strong>Description:</strong> {showPreview.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManager;

