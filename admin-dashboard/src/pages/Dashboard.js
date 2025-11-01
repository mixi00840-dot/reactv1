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
import axios from 'axios';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard');
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard data');
      // Set default empty structure to prevent undefined errors
      setStats({
        overview: {
          totalUsers: 0,
          activeUsers: 0,
          bannedUsers: 0,
          suspendedUsers: 0,
          verifiedUsers: 0,
          featuredUsers: 0,
          pendingSellerApps: 0,
          approvedSellers: 0,
          totalStrikes: 0,
          activeStrikes: 0
        },
        topEarners: [],
        recentUsers: [],
        monthlyRegistrations: []
      });
    } finally {
      setLoading(false);
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

  const { overview = {}, topEarners = [], recentUsers = [], monthlyRegistrations = [] } = stats;

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

  // Chart data for user registrations
  const registrationChartData = {
    labels: (monthlyRegistrations || []).map(item => 
      new Date(item._id.year, item._id.month - 1).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      })
    ),
    datasets: [
      {
        label: 'New Users',
        data: (monthlyRegistrations || []).map(item => item.count || 0),
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

      {/* Stats Cards */}
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
                {topEarners.slice(0, 5).map((earner, index) => (
                  <React.Fragment key={earner.user._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={earner.user.avatar}>
                          {earner.user.fullName.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {earner.user.fullName}
                            {earner.user.isVerified && (
                              <VerifiedUser sx={{ fontSize: 16, color: 'primary.main' }} />
                            )}
                          </Box>
                        }
                        secondary={`$${earner.totalEarnings.toLocaleString()} • ${earner.supportLevel}`}
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
                ))}
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
                {recentUsers.slice(0, 5).map((user, index) => (
                  <React.Fragment key={user._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={user.avatar}>
                          {user.fullName.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.fullName}
                        secondary={`@${user.username} • ${new Date(user.createdAt).toLocaleDateString()}`}
                      />
                      <UserStatusChip status={user.status} />
                    </ListItem>
                    {index < 4 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;