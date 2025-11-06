import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StreamingProviders.css';

const StreamingProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [healthChecking, setHealthChecking] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://mixillo-backend-52242135857.europe-west1.run.app/api';

  useEffect(() => {
    fetchProviders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchProviders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchProviders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE}/streaming/providers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setProviders(response.data.data);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async (providerName) => {
    try {
      setHealthChecking(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_BASE}/streaming/providers/${providerName}/health-check`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Refresh providers to show updated health
        await fetchProviders();
      }
    } catch (err) {
      alert('Health check failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setHealthChecking(false);
    }
  };

  const runAllHealthChecks = async () => {
    try {
      setHealthChecking(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_BASE}/streaming/providers/health-check-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        await fetchProviders();
        alert('All health checks completed');
      }
    } catch (err) {
      alert('Health checks failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setHealthChecking(false);
    }
  };

  const toggleProvider = async (providerName, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API_BASE}/streaming/providers/${providerName}`,
        { enabled: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchProviders();
    } catch (err) {
      alert('Failed to toggle provider: ' + (err.response?.data?.message || err.message));
    }
  };

  const updatePriority = async (providerName, newPriority) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API_BASE}/streaming/providers/${providerName}`,
        { priority: parseInt(newPriority) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchProviders();
    } catch (err) {
      alert('Failed to update priority: ' + (err.response?.data?.message || err.message));
    }
  };

  const getHealthStatus = (provider) => {
    if (!provider.health) return 'unknown';
    
    const uptime = provider.health.uptime || 0;
    const errorRate = provider.health.errorRate || 0;
    const failures = provider.health.consecutiveFailures || 0;
    
    if (!provider.enabled) return 'disabled';
    if (failures >= 3) return 'critical';
    if (errorRate > 10 || uptime < 95) return 'warning';
    if (uptime >= 99) return 'excellent';
    return 'healthy';
  };

  const getStatusColor = (status) => {
    const colors = {
      excellent: '#10b981',
      healthy: '#22c55e',
      warning: '#f59e0b',
      critical: '#ef4444',
      disabled: '#6b7280',
      unknown: '#9ca3af'
    };
    return colors[status] || colors.unknown;
  };

  const getStatusIcon = (status) => {
    const icons = {
      excellent: '✓',
      healthy: '✓',
      warning: '⚠',
      critical: '✗',
      disabled: '⊘',
      unknown: '?'
    };
    return icons[status] || icons.unknown;
  };

  if (loading) {
    return (
      <div className="streaming-providers">
        <div className="loading">Loading providers...</div>
      </div>
    );
  }

  return (
    <div className="streaming-providers">
      <div className="page-header">
        <div>
          <h1>Streaming Providers</h1>
          <p>Manage live streaming infrastructure and automatic failover</p>
        </div>
        <button 
          onClick={runAllHealthChecks}
          disabled={healthChecking}
          className="btn-primary"
        >
          {healthChecking ? 'Checking...' : 'Check All Health'}
        </button>
      </div>

      {error && (
        <div className="error-banner">{error}</div>
      )}

      <div className="providers-grid">
        {providers.map(provider => {
          const status = getHealthStatus(provider);
          const statusColor = getStatusColor(status);
          
          return (
            <div key={provider._id} className="provider-card">
              <div className="provider-header">
                <div className="provider-title">
                  <h3>{provider.displayName}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: statusColor }}
                  >
                    {getStatusIcon(status)} {status.toUpperCase()}
                  </span>
                </div>
                <div className="provider-actions">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={provider.enabled}
                      onChange={() => toggleProvider(provider.name, provider.enabled)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="provider-stats">
                <div className="stat-item">
                  <span className="stat-label">Uptime</span>
                  <span className="stat-value">
                    {provider.health?.uptime?.toFixed(2) || 0}%
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Error Rate</span>
                  <span className="stat-value">
                    {provider.health?.errorRate?.toFixed(2) || 0}%
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Active Streams</span>
                  <span className="stat-value">
                    {provider.stats?.activeStreams || 0}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Streams</span>
                  <span className="stat-value">
                    {provider.stats?.totalStreams || 0}
                  </span>
                </div>
              </div>

              <div className="provider-details">
                <div className="detail-row">
                  <span>Priority:</span>
                  <input
                    type="number"
                    value={provider.priority}
                    onChange={(e) => updatePriority(provider.name, e.target.value)}
                    className="priority-input"
                    min="1"
                    max="100"
                  />
                </div>
                <div className="detail-row">
                  <span>Consecutive Failures:</span>
                  <span className={provider.health?.consecutiveFailures >= 3 ? 'text-danger' : ''}>
                    {provider.health?.consecutiveFailures || 0}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Last Health Check:</span>
                  <span>
                    {provider.health?.lastCheck 
                      ? new Date(provider.health.lastCheck).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Monthly Cost:</span>
                  <span>${provider.stats?.monthlyCost?.toFixed(2) || 0}</span>
                </div>
              </div>

              <div className="provider-footer">
                <button
                  onClick={() => runHealthCheck(provider.name)}
                  disabled={healthChecking}
                  className="btn-secondary"
                >
                  {healthChecking ? 'Checking...' : 'Health Check'}
                </button>
                <span className="provider-type">{provider.name}</span>
              </div>

              {provider.health?.consecutiveFailures >= 3 && (
                <div className="alert-banner">
                  ⚠ Automatic failover will activate on next stream attempt
                </div>
              )}
            </div>
          );
        })}
      </div>

      {providers.length === 0 && (
        <div className="empty-state">
          <p>No streaming providers configured</p>
        </div>
      )}

      <div className="info-panel">
        <h3>How Automatic Failover Works</h3>
        <ul>
          <li><strong>Health Monitoring:</strong> Every 30 seconds during active streams</li>
          <li><strong>Failure Threshold:</strong> 3 consecutive failures trigger automatic failover</li>
          <li><strong>Priority Order:</strong> Lower priority number = higher preference</li>
          <li><strong>Retry Logic:</strong> 3 attempts per operation before switching providers</li>
          <li><strong>Live Migration:</strong> Active streams migrate seamlessly when backend switches providers</li>
        </ul>
      </div>
    </div>
  );
};

export default StreamingProviders;
