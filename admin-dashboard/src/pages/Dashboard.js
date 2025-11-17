import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import {
  People,
  VerifiedUser,
  Star,
  Business,
  Warning,
  TrendingUp,
  Block,
  Pause,
  ThumbUp,
  Chat,
  Visibility,
  Share,
  PeopleAlt,
  Gavel,
} from '@mui/icons-material';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
// MongoDB Migration - Use MongoDB API instead of Firebase
import mongoAPI from '../utils/apiMongoDB';
import api from '../utils/api';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatCard = ({ title, value, icon, color = 'primary', trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" color={color}>
            {value}
          </Typography>
          {trend && (
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUp sx={{ fontSize: 16, mr: 0.5, color: 'success.main' }} />
              <Typography variant="body2" color="success.main">
                {trend}
              </Typography>
            </Box>
          )}
        </Box>
        <Box color={`${color}.main`}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const UserStatusChip = ({ status }) => {
  const getChipProps = () => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'success' };
      case 'suspended':
        return { label: 'Suspended', color: 'warning' };
      case 'banned':
        return { label: 'Banned', color: 'error' };
      default:
        return { label: status, color: 'default' };
    }
  };

  return <Chip size="small" {...getChipProps()} />;
};

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchRealtimeStats();
    
    // Auto-refresh realtime stats every 30 seconds
    const interval = setInterval(fetchRealtimeStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await mongoAPI.analytics.getDashboard();
      console.log('Dashboard API Response:', response);
      
      // Extract data from various possible response structures
      const data = response?.data || response;
      
      // Set stats with proper defaults
      setStats({
        overview: data?.overview || {},
        topEarners: Array.isArray(data?.topEarners) ? data.topEarners : [],
        recentUsers: Array.isArray(data?.recentUsers) ? data.recentUsers : [],
        monthlyRegistrations: Array.isArray(data?.monthlyRegistrations) ? data.monthlyRegistrations : []
      });
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard data');
      // Set default empty structure to prevent undefined errors
      setStats({
        overview: {},
        topEarners: [],
        recentUsers: [],
        monthlyRegistrations: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeStats = async () => {
    try {
      const response = await api.get('/admin/realtime/stats');
      if (response.success) {
        setRealtimeStats(response.data);
      }
    } catch (error) {
      console.error('Realtime stats fetch error:', error);
      // Don't show toast for auto-refresh failures
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          Failed to load dashboard data
        </Typography>
      </Box>
    );
  }

  const { overview = {}, topEarners = [], recentUsers = [], monthlyRegistrations = [] } = stats || {};

  // Ensure overview has all required properties with defaults
  const safeOverview = {
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    suspendedUsers: 0,
    verifiedUsers: 0,
    featuredUsers: 0,
    pendingSellerApps: 0,
    approvedSellers: 0,
    totalStrikes: 0,
    activeStrikes: 0,
    ...overview
  };

  // Safely process monthly registrations data - SIMPLIFIED
  let chartLabels = [];
  let chartData = [];
  
  try {
    if (Array.isArray(monthlyRegistrations) && monthlyRegistrations.length > 0) {
      monthlyRegistrations.forEach(item => {
        if (item && item._id && item._id.year && item._id.month) {
          // Simple string concatenation - no date parsing
          const label = `${item._id.month}/${item._id.year}`;
          chartLabels.push(label);
          chartData.push(item.count || 0);
        }
      });
    }
  } catch (err) {
    console.error('Error processing chart data:', err);
  }
  
  // Use fallback if no data
  if (chartLabels.length === 0) {
    chartLabels = ['No Data'];
    chartData = [0];
  }

  // Chart data for user registrations
  const registrationChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'New Users',
        data: chartData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  // Chart data for user status distribution
  const statusChartData = {
    labels: ['Active', 'Suspended', 'Banned'],
    datasets: [
      {
        data: [safeOverview.activeUsers, safeOverview.suspendedUsers, safeOverview.bannedUsers],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard Overview
      </Typography>

      {/* Real-Time Interaction Stats */}
      {realtimeStats && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
            Real-Time Platform Activity
          </Typography>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Likes Today"
                value={(realtimeStats.interactions?.likesToday || 0).toLocaleString()}
                icon={<ThumbUp sx={{ fontSize: 40 }} />}
                color="error"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Comments Today"
                value={(realtimeStats.interactions?.commentsToday || 0).toLocaleString()}
                icon={<Chat sx={{ fontSize: 40 }} />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Views Today"
                value={(realtimeStats.interactions?.viewsToday || 0).toLocaleString()}
                icon={<Visibility sx={{ fontSize: 40 }} />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Shares Today"
                value={(realtimeStats.interactions?.sharesToday || 0).toLocaleString()}
                icon={<Share sx={{ fontSize: 40 }} />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="Active Viewers"
                value={(realtimeStats.socketIO?.connectedClients || 0).toLocaleString()}
                icon={<PeopleAlt sx={{ fontSize: 40 }} />}
                color="warning"
              />
            </Grid>
          </Grid>
        </>
      )}

      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        User Statistics
      </Typography>

      {/* User Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={(safeOverview.totalUsers || 0).toLocaleString()}
            icon={<People sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={(safeOverview.activeUsers || 0).toLocaleString()}
            icon={<VerifiedUser sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Verified Users"
            value={(safeOverview.verifiedUsers || 0).toLocaleString()}
            icon={<Star sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved Sellers"
            value={(safeOverview.approvedSellers || 0).toLocaleString()}
            icon={<Business sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Secondary Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Applications"
            value={(safeOverview.pendingSellerApps || 0).toLocaleString()}
            icon={<Business sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Strikes"
            value={(safeOverview.activeStrikes || 0).toLocaleString()}
            icon={<Warning sx={{ fontSize: 40 }} />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Suspended Users"
            value={(safeOverview.suspendedUsers || 0).toLocaleString()}
            icon={<Pause sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Banned Users"
            value={(safeOverview.bannedUsers || 0).toLocaleString()}
            icon={<Block sx={{ fontSize: 40 }} />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Charts and Lists */}
      <Grid container spacing={3}>
        {/* Registration Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Registration Trend
              </Typography>
              <Box height={300}>
                <Line data={registrationChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* User Status Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Status Distribution
              </Typography>
              <Box height={300} display="flex" justifyContent="center" alignItems="center">
                <Doughnut data={statusChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Earners */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Earners
              </Typography>
              <List>
                {(topEarners || []).slice(0, 5).map((earner, index) => {
                  const user = earner?.user || {};
                  const displayName = user.fullName || user.username || user.email || 'User';
                  const initial = typeof displayName === 'string' && displayName.length > 0 ? displayName.charAt(0) : 'U';
                  return (
                    <React.Fragment key={user._id || index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar src={user.avatar}>
                            {initial}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              {displayName}
                              {user.isVerified && (
                                <VerifiedUser sx={{ fontSize: 16, color: 'primary.main' }} />
                              )}
                            </Box>
                          }
                          secondary={`$${Number(earner?.totalEarnings || 0).toLocaleString()} • ${earner?.supportLevel || 'Supporter'}`}
                        />
                        <Chip 
                          label={`#${index + 1}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </ListItem>
                      {index < 4 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Users
              </Typography>
              <List>
                {(recentUsers || []).slice(0, 5).map((user, index) => {
                  const displayName = user?.fullName || user?.username || user?.email || 'User';
                  const initial = typeof displayName === 'string' && displayName.length > 0 ? displayName.charAt(0) : 'U';
                  const username = user?.username ? `@${user.username}` : (user?.email || '');
                  let dateText = '';
                  try { dateText = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''; } catch {}
                  return (
                    <React.Fragment key={user?._id || index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar src={user?.avatar}>
                            {initial}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={displayName}
                          secondary={[username, dateText].filter(Boolean).join(' • ')}
                        />
                        <UserStatusChip status={user?.status || 'active'} />
                      </ListItem>
                      {index < 4 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
