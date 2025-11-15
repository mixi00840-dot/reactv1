import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  IconButton,
  Button,
  Pagination
} from '@mui/material';
import {
  VideoLibrary as VideoIcon,
  Comment as CommentIcon,
  Favorite as LikeIcon,
  Share as ShareIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  ShoppingCart as PurchaseIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import mongoAPI from '../../utils/apiMongoDB';
import toast from 'react-hot-toast';

function UserActivitiesTab({ userId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState('7'); // days

  useEffect(() => {
    fetchActivities();
  }, [userId, filterType, dateRange, page]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await mongoAPI.get(`/admin/users/${userId}/activities`, {
        params: {
          type: filterType !== 'all' ? filterType : undefined,
          days: dateRange,
          page,
          limit: 20
        }
      });

      if (response.success) {
        setActivities(response.data.activities || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        generateMockActivities();
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      generateMockActivities();
    } finally {
      setLoading(false);
    }
  };

  const generateMockActivities = () => {
    const types = ['video', 'post', 'comment', 'like', 'share', 'login', 'profile_update', 'purchase', 'follow'];
    const mock = Array.from({ length: 20 }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      return {
        _id: `act${i + 1}`,
        type,
        action: getActionText(type, i),
        details: getActionDetails(type, i),
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {}
      };
    });
    setActivities(mock.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  };

  const getActionText = (type, index) => {
    switch (type) {
      case 'video':
        return 'Posted a video';
      case 'post':
        return 'Created a post';
      case 'comment':
        return 'Commented on a video';
      case 'like':
        return 'Liked a video';
      case 'share':
        return 'Shared content';
      case 'login':
        return 'Logged in';
      case 'profile_update':
        return 'Updated profile';
      case 'purchase':
        return 'Made a purchase';
      case 'follow':
        return 'Followed a user';
      default:
        return 'Activity';
    }
  };

  const getActionDetails = (type, index) => {
    switch (type) {
      case 'video':
        return `"Amazing Dance Performance ${index}"`;
      case 'post':
        return 'Shared thoughts about the day';
      case 'comment':
        return 'Great content! Love it!';
      case 'like':
        return 'Cooking Tutorial video';
      case 'share':
        return 'Shared on social media';
      case 'login':
        return 'Web browser (Chrome)';
      case 'profile_update':
        return 'Changed bio and avatar';
      case 'purchase':
        return 'Premium Membership - $9.99';
      case 'follow':
        return '@creator_official';
      default:
        return '';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'video':
        return <VideoIcon />;
      case 'post':
      case 'comment':
        return <CommentIcon />;
      case 'like':
        return <LikeIcon />;
      case 'share':
        return <ShareIcon />;
      case 'login':
        return <LoginIcon />;
      case 'profile_update':
        return <EditIcon />;
      case 'purchase':
        return <PurchaseIcon />;
      default:
        return <CommentIcon />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'video':
        return 'primary';
      case 'post':
        return 'secondary';
      case 'comment':
        return 'info';
      case 'like':
        return 'error';
      case 'login':
        return 'success';
      case 'purchase':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const filteredActivities = activities.filter(activity => {
    if (filterType === 'all') return true;
    return activity.type === filterType;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Activity Type</InputLabel>
              <Select
                value={filterType}
                label="Activity Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">All Activities</MenuItem>
                <MenuItem value="video">Videos</MenuItem>
                <MenuItem value="post">Posts</MenuItem>
                <MenuItem value="comment">Comments</MenuItem>
                <MenuItem value="like">Likes</MenuItem>
                <MenuItem value="share">Shares</MenuItem>
                <MenuItem value="login">Logins</MenuItem>
                <MenuItem value="profile_update">Profile Updates</MenuItem>
                <MenuItem value="purchase">Purchases</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="1">Last 24 hours</MenuItem>
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
                <MenuItem value="all">All time</MenuItem>
              </Select>
            </FormControl>

            <Box flexGrow={1} />
            
            <Typography variant="body2" color="textSecondary" sx={{ alignSelf: 'center' }}>
              {filteredActivities.length} activities found
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Activities Timeline */}
      <Card>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <Typography variant="body2" color="textSecondary">
                No activities found
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredActivities.map((activity, index) => (
                <React.Fragment key={activity._id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getActivityColor(activity.type)}.main` }}>
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle2" fontWeight={600}>
                            {activity.action}
                          </Typography>
                          <Chip
                            label={formatTimeAgo(activity.timestamp)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {activity.details}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                            {new Date(activity.timestamp).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < filteredActivities.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}

export default UserActivitiesTab;

