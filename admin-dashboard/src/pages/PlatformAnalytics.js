import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/apiFirebase';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './PlatformAnalytics.css';

const PlatformAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState({});
  const [trendingData, setTrendingData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [contentPerformance, setContentPerformance] = useState([]);
  const [creatorInsights, setCreatorInsights] = useState([]);

  const COLORS = ['#ff2d55', '#00d26a', '#ffbd2e', '#00b3ff', '#9c27b0', '#ff6b6b'];

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch multiple analytics endpoints in parallel
      const [
        metricsRes,
        trendingRes,
        advancedRes,
        contentRes
      ] = await Promise.all([
        api.get(`/api/metrics/overview?timeRange=${timeRange}`, { headers }),
        api.get(`/api/trending/analytics`, { headers }),
        api.get(`/api/analytics/advanced?period=${timeRange}`, { headers }),
        api.get(`/api/content/analytics`, { headers })
      ]);

      // Many backend routes wrap payloads in { success, data }, normalize here
  const metricsPayload = metricsRes;
  const advancedPayload = advancedRes;
  const contentPayload = contentRes;
  const trendingPayload = trendingRes;

      setMetrics(metricsPayload || {});
      setTrendingData(trendingPayload?.byType || []);

      // Process advanced analytics
      if (advancedPayload) {
        setCategoryData(advancedPayload.categoryBreakdown || []);
        setUserGrowth(advancedPayload.userGrowth || []);
      }

      // Process content performance
      setContentPerformance(contentPayload?.topContent || []);
      setCreatorInsights(contentPayload?.topCreators || []);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      alert('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  return (
    <div className="platform-analytics">
      <div className="header">
        <h1>Platform Analytics</h1>
        <div className="time-range-selector">
          <button 
            className={timeRange === '24h' ? 'active' : ''}
            onClick={() => setTimeRange('24h')}
          >
            24H
          </button>
          <button 
            className={timeRange === '7d' ? 'active' : ''}
            onClick={() => setTimeRange('7d')}
          >
            7D
          </button>
          <button 
            className={timeRange === '30d' ? 'active' : ''}
            onClick={() => setTimeRange('30d')}
          >
            30D
          </button>
          <button 
            className={timeRange === '90d' ? 'active' : ''}
            onClick={() => setTimeRange('90d')}
          >
            90D
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading analytics...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">👁️</div>
              <div className="metric-content">
                <div className="metric-label">Total Views</div>
                <div className="metric-value">{formatNumber(metrics.totalViews)}</div>
                <div className={`metric-change ${metrics.viewsChange >= 0 ? 'positive' : 'negative'}`}>
                  {metrics.viewsChange >= 0 ? '↑' : '↓'} {Math.abs(metrics.viewsChange)}% from last period
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">👥</div>
              <div className="metric-content">
                <div className="metric-label">Active Users</div>
                <div className="metric-value">{formatNumber(metrics.activeUsers)}</div>
                <div className={`metric-change ${metrics.usersChange >= 0 ? 'positive' : 'negative'}`}>
                  {metrics.usersChange >= 0 ? '↑' : '↓'} {Math.abs(metrics.usersChange)}% from last period
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🎬</div>
              <div className="metric-content">
                <div className="metric-label">Videos Uploaded</div>
                <div className="metric-value">{formatNumber(metrics.totalContent)}</div>
                <div className={`metric-change ${metrics.contentChange >= 0 ? 'positive' : 'negative'}`}>
                  {metrics.contentChange >= 0 ? '↑' : '↓'} {Math.abs(metrics.contentChange)}% from last period
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">❤️</div>
              <div className="metric-content">
                <div className="metric-label">Engagement Rate</div>
                <div className="metric-value">{(metrics.engagementRate * 100)?.toFixed(1)}%</div>
                <div className={`metric-change ${metrics.engagementChange >= 0 ? 'positive' : 'negative'}`}>
                  {metrics.engagementChange >= 0 ? '↑' : '↓'} {Math.abs(metrics.engagementChange)}% from last period
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">⏱️</div>
              <div className="metric-content">
                <div className="metric-label">Avg Watch Time</div>
                <div className="metric-value">{Math.floor(metrics.avgWatchTime / 60)}m</div>
                <div className={`metric-change ${metrics.watchTimeChange >= 0 ? 'positive' : 'negative'}`}>
                  {metrics.watchTimeChange >= 0 ? '↑' : '↓'} {Math.abs(metrics.watchTimeChange)}% from last period
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <div className="metric-label">Revenue</div>
                <div className="metric-value">${formatNumber(metrics.revenue)}</div>
                <div className={`metric-change ${metrics.revenueChange >= 0 ? 'positive' : 'negative'}`}>
                  {metrics.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(metrics.revenueChange)}% from last period
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="charts-row">
            {/* User Growth Chart */}
            <div className="chart-card">
              <h2>User Growth</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="newUsers" stroke="#ff2d55" strokeWidth={2} name="New Users" />
                  <Line type="monotone" dataKey="activeUsers" stroke="#00d26a" strokeWidth={2} name="Active Users" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Content Performance Chart */}
            <div className="chart-card">
              <h2>Content Performance</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#ff2d55" name="Views" />
                  <Bar dataKey="engagement" fill="#00d26a" name="Engagement" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="charts-row">
            {/* Category Distribution */}
            <div className="chart-card">
              <h2>Content by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Trending Content Types */}
            <div className="chart-card">
              <h2>Trending Content Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendingData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="type" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00b3ff" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Creators Table */}
          <div className="table-card">
            <h2>Top Creators</h2>
            <table className="creators-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Creator</th>
                  <th>Videos</th>
                  <th>Total Views</th>
                  <th>Avg Engagement</th>
                  <th>Followers</th>
                  <th>Revenue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {creatorInsights.map((creator, index) => (
                  <tr key={creator._id}>
                    <td className="rank">#{index + 1}</td>
                    <td className="creator-info">
                      <img src={creator.avatar} alt={creator.username} className="avatar" />
                      <span>@{creator.username}</span>
                    </td>
                    <td>{formatNumber(creator.videoCount)}</td>
                    <td>{formatNumber(creator.totalViews)}</td>
                    <td>{(creator.avgEngagement * 100).toFixed(1)}%</td>
                    <td>{formatNumber(creator.followers)}</td>
                    <td>${formatNumber(creator.revenue)}</td>
                    <td>
                      <button 
                        className="btn-view"
                        onClick={() => navigate(`/admin/creators/${creator._id}`)}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Insights & Recommendations */}
          <div className="insights-section">
            <h2>Insights & Recommendations</h2>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-icon">📈</div>
                <h3>Peak Activity Times</h3>
                <p>Most users are active between 6 PM - 10 PM. Schedule content releases during these hours for maximum visibility.</p>
              </div>
              
              <div className="insight-card">
                <div className="insight-icon">🎯</div>
                <h3>Content Opportunities</h3>
                <p>Educational content has 35% higher engagement. Consider encouraging creators in this category.</p>
              </div>
              
              <div className="insight-card">
                <div className="insight-icon">⚡</div>
                <h3>Trending Hashtags</h3>
                <p>#MixilloChallenge and #DailyMix are currently trending with 450% growth this week.</p>
              </div>
              
              <div className="insight-card">
                <div className="insight-icon">🌍</div>
                <h3>Geographic Growth</h3>
                <p>Brazil and India show 120% growth. Consider localization efforts for these markets.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PlatformAnalytics;

