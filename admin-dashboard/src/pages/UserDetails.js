import React, { useState, useEffect } from 'react';
import {
  Typography, Box, Grid, Card, CardContent, Avatar, Chip, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Alert, Badge, LinearProgress, Switch,
  FormControlLabel, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  Edit as EditIcon, Block as BlockIcon,
  CheckCircle as ApproveIcon, MonetizationOn as MoneyIcon,
  VideoLibrary as VideoIcon, Comment as CommentIcon,
  Store as StoreIcon, People as FollowersIcon,
  Star as StarIcon, Upload as UploadIcon, History as ActivityIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
// MongoDB Migration
import mongoAPI from '../utils/apiMongoDB';
import toast from 'react-hot-toast';
// Import new tab components
import UserVideosTab from '../components/tabs/UserVideosTab';
import UserPostsTab from '../components/tabs/UserPostsTab';
import UserWalletTab from '../components/tabs/UserWalletTab';
import UserSocialTab from '../components/tabs/UserSocialTab';
import UserActivitiesTab from '../components/tabs/UserActivitiesTab';
import UserUploadsTab from '../components/tabs/UserUploadsTab';
import UserProductsTab from '../components/tabs/UserProductsTab';
const api = mongoAPI; // Alias for backward compatibility

function TabPanel({ children, value, index, ...other }) {
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function UserDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [userStats, setUserStats] = useState({
    videos: [],
    posts: [],
    comments: [],
    wallet: { balance: 0, totalEarnings: 0, pendingPayments: 0, lastTransaction: 'N/A' },
    followers: [],
    following: [],
    earnings: [],
    products: [],
    activities: []
  });

  useEffect(() => {
    fetchUserDetails();
    fetchUserStats();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      // Fetch user details
      const payload = await api.get(`/api/admin/users/${id}`);
      const userData = payload?.data || payload?.user || payload;
      setUser(userData);
      setEditedUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user details');
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const payload = await api.get(`/api/admin/users/${id}`);
      const userData = payload?.data || payload?.user || payload || {};

      // Only use real data; no mock content
      setUserStats({
        videos: Array.isArray(userData.videos) ? userData.videos : [],
        posts: Array.isArray(userData.posts) ? userData.posts : [],
        comments: Array.isArray(userData.comments) ? userData.comments : [],
        wallet: userData.wallet || { balance: 0, totalEarnings: 0, pendingPayments: 0, lastTransaction: 'N/A' },
        followers: Array.isArray(userData.followers) ? userData.followers : [],
        following: Array.isArray(userData.following) ? userData.following : [],
        earnings: Array.isArray(userData.earnings) ? userData.earnings : [],
        products: Array.isArray(userData.products) ? userData.products : [],
        activities: Array.isArray(userData.recentActivities) ? userData.recentActivities : []
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleEditUser = async () => {
    try {
      await api.put(`/api/admin/users/${id}`, editedUser);
      setUser(editedUser);
      setEditDialog(false);
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  const handleUserAction = async (action) => {
    console.log(`🔵 User action triggered: ${action} for user:`, id);
    
    try {
      const endpoint = `/api/admin/users/${id}/${action}`;
      console.log(`📞 Calling endpoint: ${endpoint}`);
      const response = await api.put(endpoint, {});
      
      console.log(`✅ ${action} successful:`, response);
      
      if (action === 'make-seller' && response?.data) {
        console.log('🏪 Store created:', response.data.storeCreated);
        console.log('📦 Store details:', response.data.store);
      }
      
      fetchUserDetails();
      alert(response?.message || `User ${action} successfully!`);
    } catch (error) {
      console.error(`❌ Error ${action} user:`, error);
      alert(error?.message || `Error ${action} user`);
    }
  };

  if (loading) return <LinearProgress />;
  if (!user) return <Alert severity="error">User not found</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Badge
                badgeContent={user?.isVerified ? <ApproveIcon color="primary" /> : null}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Avatar
                  src={user?.avatar}
                  sx={{ width: 120, height: 120 }}
                  alt={user?.username}
                >
                  {user?.username?.[0]?.toUpperCase()}
                </Avatar>
              </Badge>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" gutterBottom>
                {user?.username}
                {user?.role === 'seller' && (
                  <>
                    <Chip 
                      label="Verified Seller" 
                      icon={<ApproveIcon />}
                      color="success" 
                      sx={{ ml: 1 }} 
                    />
                    {user?.storeId && (
                      <Chip 
                        label={user.storeId.name || "Store"} 
                        icon={<StoreIcon />}
                        color="primary" 
                        sx={{ ml: 1 }}
                        clickable
                        onClick={() => window.open(`/stores/${user.storeId._id}`, '_blank')}
                      />
                    )}
                  </>
                )}
                {user?.isFeatured && <Chip label="Featured" color="secondary" sx={{ ml: 1 }} />}
                {user?.isBanned && <Chip label="Banned" color="error" sx={{ ml: 1 }} />}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                {user?.email} • Joined {user?.createdAt && !Number.isNaN(Date.parse(user.createdAt)) ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {user?.bio || "No bio available"}
              </Typography>
              
              {/* Quick Stats */}
              <Grid container spacing={2}>
                <Grid item>
                  <Box textAlign="center">
                    <Typography variant="h6">{user?.socialStats?.followersCount || userStats?.followers?.length || 0}</Typography>
                    <Typography variant="caption">Followers</Typography>
                  </Box>
                </Grid>
                <Grid item>
                  <Box textAlign="center">
                    <Typography variant="h6">{user?.socialStats?.followingCount || userStats?.following?.length || 0}</Typography>
                    <Typography variant="caption">Following</Typography>
                  </Box>
                </Grid>
                <Grid item>
                  <Box textAlign="center">
                    <Typography variant="h6">{user?.contentStats?.totalVideos || userStats?.videos?.length || 0}</Typography>
                    <Typography variant="caption">Videos</Typography>
                  </Box>
                </Grid>
                <Grid item>
                  <Box textAlign="center">
                    <Typography variant="h6">
                      {(user?.contentStats?.totalViews || userStats?.videos?.reduce((acc, video) => acc + video.views, 0) || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption">Total Views</Typography>
                  </Box>
                </Grid>
                {user?.role === 'seller' && (
                  <Grid item>
                    <Box textAlign="center">
                      <Typography variant="h6">${(user?.wallet?.totalEarnings || userStats?.wallet?.totalEarnings || 0).toFixed(2)}</Typography>
                      <Typography variant="caption">Total Earnings</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Grid>
            <Grid item>
              <Box display="flex" gap={1} flexDirection="column">
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setEditDialog(true)}
                >
                  Edit User
                </Button>
                {user?.role !== 'seller' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<StoreIcon />}
                    onClick={() => handleUserAction('make-seller')}
                  >
                    Make Seller & Create Store
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color={user?.isBanned ? "success" : "error"}
                  startIcon={user?.isBanned ? <ApproveIcon /> : <BlockIcon />}
                  onClick={() => handleUserAction(user?.isBanned ? 'unban' : 'ban')}
                >
                  {user?.isBanned ? 'Unban' : 'Ban'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<StarIcon />}
                  onClick={() => handleUserAction(user?.isFeatured ? 'unfeature' : 'feature')}
                >
                  {user?.isFeatured ? 'Unfeature' : 'Feature'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<VideoIcon />} label="Videos" />
          <Tab icon={<CommentIcon />} label="Posts" />
          {user?.role === 'seller' && <Tab icon={<StoreIcon />} label="Products" />}
          <Tab icon={<MoneyIcon />} label="Wallet" />
          <Tab icon={<FollowersIcon />} label="Social" />
          <Tab icon={<ActivityIcon />} label="Activities" />
          <Tab icon={<UploadIcon />} label="Uploads" />
        </Tabs>

        {/* Videos Tab */}
        <TabPanel value={tabValue} index={0}>
          <UserVideosTab userId={id} />
        </TabPanel>

        {/* Posts Tab */}
        <TabPanel value={tabValue} index={1}>
          <UserPostsTab userId={id} />
        </TabPanel>

        {/* Products Tab (Only for Sellers) */}
        {user?.role === 'seller' && (
          <TabPanel value={tabValue} index={2}>
            <UserProductsTab userId={id} />
          </TabPanel>
        )}

        {/* Wallet Tab */}
        <TabPanel value={tabValue} index={user?.role === 'seller' ? 3 : 2}>
          <UserWalletTab userId={id} />
        </TabPanel>

        {/* Social Tab */}
        <TabPanel value={tabValue} index={user?.role === 'seller' ? 4 : 3}>
          <UserSocialTab userId={id} />
        </TabPanel>

        {/* Activities Tab */}
        <TabPanel value={tabValue} index={user?.role === 'seller' ? 5 : 4}>
          <UserActivitiesTab userId={id} />
        </TabPanel>

        {/* Uploads Tab */}
        <TabPanel value={tabValue} index={user?.role === 'seller' ? 6 : 5}>
          <UserUploadsTab userId={id} />
        </TabPanel>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit User Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={editedUser.username || ''}
                onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={editedUser.email || ''}
                onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Bio"
                value={editedUser.bio || ''}
                onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editedUser.role || 'user'}
                  onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="seller">Seller</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editedUser.isVerified || false}
                    onChange={(e) => setEditedUser({ ...editedUser, isVerified: e.target.checked })}
                  />
                }
                label="Verified Account"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editedUser.isFeatured || false}
                    onChange={(e) => setEditedUser({ ...editedUser, isFeatured: e.target.checked })}
                  />
                }
                label="Featured User"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editedUser.isBanned || false}
                    onChange={(e) => setEditedUser({ ...editedUser, isBanned: e.target.checked })}
                  />
                }
                label="Banned"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditUser} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserDetails;
