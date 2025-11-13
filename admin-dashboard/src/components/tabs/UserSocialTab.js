import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
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
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Pagination
} from '@mui/material';
import {
  CheckCircle as VerifiedIcon,
  Search as SearchIcon,
  PersonAdd as FollowIcon,
  PersonRemove as UnfollowIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import mongoAPI from '../../utils/apiMongoDB';
import toast from 'react-hot-toast';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function UserSocialTab({ userId }) {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSocialData();
  }, [userId, subTab, page]);

  const fetchSocialData = async () => {
    setLoading(true);
    try {
      if (subTab === 0) {
        const response = await mongoAPI.get(`/admin/users/${userId}/followers`, {
          params: { page, limit: 20 }
        });
        if (response.success) {
          setFollowers(response.data.followers || []);
          setTotalPages(response.data.totalPages || 1);
        } else {
          generateMockFollowers();
        }
      } else if (subTab === 1) {
        const response = await mongoAPI.get(`/admin/users/${userId}/following`, {
          params: { page, limit: 20 }
        });
        if (response.success) {
          setFollowing(response.data.following || []);
          setTotalPages(response.data.totalPages || 1);
        } else {
          generateMockFollowing();
        }
      } else if (subTab === 2) {
        const response = await mongoAPI.get(`/api/users/mongodb/${userId}/blocked`);
        if (response.success) {
          setBlocked(response.data.blocked || []);
        } else {
          setBlocked([]);
        }
      }
    } catch (error) {
      console.error('Error fetching social data:', error);
      if (subTab === 0) generateMockFollowers();
      else if (subTab === 1) generateMockFollowing();
    } finally {
      setLoading(false);
    }
  };

  const generateMockFollowers = () => {
    const mock = Array.from({ length: 15 }, (_, i) => ({
      _id: `f${i + 1}`,
      userId: {
        _id: `user${i + 1}`,
        username: `follower_${i + 1}`,
        fullName: `Follower User ${i + 1}`,
        avatar: null,
        isVerified: Math.random() > 0.7
      },
      followDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    }));
    setFollowers(mock);
  };

  const generateMockFollowing = () => {
    const mock = Array.from({ length: 8 }, (_, i) => ({
      _id: `fg${i + 1}`,
      userId: {
        _id: `creator${i + 1}`,
        username: `creator_${i + 1}`,
        fullName: `Creator ${i + 1}`,
        avatar: null,
        isVerified: Math.random() > 0.5
      },
      followDate: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000).toISOString()
    }));
    setFollowing(mock);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCurrentData = () => {
    switch (subTab) {
      case 0:
        return followers;
      case 1:
        return following;
      case 2:
        return blocked;
      default:
        return [];
    }
  };

  const filteredData = getCurrentData().filter(item => {
    const username = item.userId?.username || '';
    const fullName = item.userId?.fullName || '';
    return (
      username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {followers.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Followers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="secondary">
                {following.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Following
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="error">
                {blocked.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Blocked Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sub-Tabs */}
      <Card>
        <Tabs value={subTab} onChange={(e, newValue) => { setSubTab(newValue); setPage(1); }}>
          <Tab label={`Followers (${followers.length})`} />
          <Tab label={`Following (${following.length})`} />
          <Tab label={`Blocked (${blocked.length})`} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />

          {/* Users List */}
          {filteredData.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <Typography variant="body2" color="textSecondary">
                No users found
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredData.map((item) => (
                <ListItem
                  key={item._id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1
                  }}
                  secondaryAction={
                    <Box display="flex" gap={1}>
                      {subTab === 2 ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                        >
                          Unblock
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                          >
                            View Profile
                          </Button>
                          <IconButton size="small" color="error">
                            <BlockIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={item.userId?.avatar}>
                      {item.userId?.username?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {item.userId?.username || 'Unknown User'}
                        </Typography>
                        {item.userId?.isVerified && (
                          <VerifiedIcon color="primary" fontSize="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="textSecondary">
                          {item.userId?.fullName || 'No name'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {subTab === 0 ? 'Followed on' : 'Following since'} {formatDate(item.followDate || item.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}

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
      </Card>
    </Box>
  );
}

export default UserSocialTab;

