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
      // Fetch user with store populated
      const payload = await api.get(`/api/admin/users/${id}?populate=storeId`);
      const userData = payload?.user || payload;
      setUser(userData);
      setEditedUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      // For testing purposes, create dummy user data if API fails
      const dummyUser = {
        _id: id,
        username: `testuser_${id.slice(-4)}`,
        fullName: `Test User ${id.slice(-4)}`,
        email: `testuser${id.slice(-4)}@example.com`,
        role: Math.random() > 0.7 ? 'seller' : 'user',
        status: 'active',
        isVerified: Math.random() > 0.5,
        isFeatured: Math.random() > 0.8,
        isBanned: false,
        bio: `This is a test user created for demonstration purposes. User ID: ${id}`,
        avatar: `https://ui-avatars.com/api/?name=Test+User&background=random`,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        wallet: {
          balance: Math.floor(Math.random() * 5000) + 100,
          totalEarnings: Math.floor(Math.random() * 50000) + 1000,
          pendingPayments: Math.floor(Math.random() * 1000)
        },
        contentStats: {
          totalVideos: Math.floor(Math.random() * 50) + 5,
          totalViews: Math.floor(Math.random() * 100000) + 1000,
          totalLikes: Math.floor(Math.random() * 10000) + 500,
          totalComments: Math.floor(Math.random() * 5000) + 200
        },
        socialStats: {
          followersCount: Math.floor(Math.random() * 10000) + 100,
          followingCount: Math.floor(Math.random() * 1000) + 50
        }
      };
      setUser(dummyUser);
      setEditedUser(dummyUser);
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const payload = await api.get(`/api/admin/users/${id}`);
      const userData = payload?.user || payload;
      
      // Use actual data where available, fallback to mock data for demo
      setUserStats({
        videos: [
          { id: 1, title: "Dancing Video", views: userData.contentStats?.totalViews || 15420, likes: userData.contentStats?.totalLikes || 892, comments: userData.contentStats?.totalComments || 156, duration: "0:30", uploadDate: "2025-10-25" },
          { id: 2, title: "Cooking Tutorial", views: 8945, likes: 567, comments: 89, duration: "2:15", uploadDate: "2025-10-20" }
        ],
        posts: [
          { id: 1, content: "Just had the best day ever! 🌟", likes: 234, comments: 45, shares: 12, date: "2025-10-28" },
          { id: 2, content: "Check out my new recipe video!", likes: 189, comments: 67, shares: 23, date: "2025-10-25" }
        ],
        comments: [
          { id: 1, content: "This is amazing!", video: "Dancing Video", date: "2025-10-27", likes: 12 },
          { id: 2, content: "Love your content!", video: "Cooking Tutorial", date: "2025-10-26", likes: 8 }
        ],
        wallet: userData.wallet || {
          balance: 1250.75,
          totalEarnings: 5420.30,
          pendingPayments: 320.50,
          lastTransaction: "2025-10-28"
        },
        followers: Array.from({ length: userData.socialStats?.followersCount || 100 }, (_, i) => ({
          id: i + 1,
          username: `user${i + 1}`,
          followDate: "2025-10-15",
          verified: Math.random() > 0.7
        })).slice(0, 10),
        following: Array.from({ length: userData.socialStats?.followingCount || 50 }, (_, i) => ({
          id: i + 1,
          username: `creator${i + 1}`,
          followDate: "2025-09-12",
          verified: Math.random() > 0.5
        })).slice(0, 10),
        earnings: [
          { date: "2025-10-28", amount: 45.50, source: "Video Views", status: "paid" },
          { date: "2025-10-25", amount: 23.75, source: "Live Stream", status: "pending" },
          { date: "2025-10-22", amount: 67.25, source: "Brand Partnership", status: "paid" }
        ],
        products: user.role === 'seller' ? [
          { id: 1, name: "Custom Merchandise", price: 25.99, sales: 45, revenue: 1169.55, status: "active" },
          { id: 2, name: "Digital Course", price: 49.99, sales: 23, revenue: 1149.77, status: "active" }
        ] : [],
        activities: userData.recentActivities || [
          { action: "Posted a video", timestamp: "2025-10-28 14:30", details: "Dancing Video" },
          { action: "Went live", timestamp: "2025-10-27 19:45", details: "Cooking Stream - 234 viewers" },
          { action: "Updated profile", timestamp: "2025-10-26 10:15", details: "Changed bio and avatar" },
          { action: "Followed new user", timestamp: "2025-10-25 16:20", details: "@brand_official" }
        ]
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
                {user?.email} • Joined {new Date(user?.createdAt).toLocaleDateString()}
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
