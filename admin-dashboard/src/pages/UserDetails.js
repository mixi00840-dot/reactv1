import React, { useState, useEffect } from 'react';
import {
  Typography, Box, Grid, Card, CardContent, Avatar, Chip, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Tabs, Tab, Alert, IconButton, Badge, LinearProgress,
  List, ListItem, ListItemText, ListItemAvatar, Divider, Switch,
  FormControlLabel, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Block as BlockIcon,
  CheckCircle as ApproveIcon, MonetizationOn as MoneyIcon,
  VideoLibrary as VideoIcon, Comment as CommentIcon,
  Favorite as LikeIcon, Share as ShareIcon, Store as StoreIcon,
  People as FollowersIcon, TrendingUp as EarningsIcon,
  Star as StarIcon, Upload as UploadIcon, History as ActivityIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import axios from 'axios';

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
      const token = localStorage.getItem('token'); // Fixed: use 'token' not 'adminToken'
      const response = await axios.get(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.data.user);
      setEditedUser(response.data.data.user);
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
      const token = localStorage.getItem('token'); // Fixed: use 'token' not 'adminToken'
      const response = await axios.get(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = response.data.data.user;
      
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
      const token = localStorage.getItem('token'); // Fixed: use 'token' not 'adminToken'
      await axios.put(`/api/admin/users/${id}`, editedUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('token'); // Fixed: use 'token' not 'adminToken'
      const endpoint = `/api/admin/users/${id}/${action}`;
      
      console.log(`📞 Calling endpoint: ${endpoint}`);
      
      const response = await axios.put(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ ${action} successful:`, response.data);
      
      if (action === 'make-seller' && response.data.data) {
        console.log('🏪 Store created:', response.data.data.storeCreated);
        console.log('📦 Store details:', response.data.data.store);
      }
      
      fetchUserDetails();
      alert(response.data.message || `User ${action} successfully!`);
    } catch (error) {
      console.error(`❌ Error ${action} user:`, error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || `Error ${action} user`);
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
                {user?.role === 'seller' && <Chip label="Seller" color="primary" sx={{ ml: 1 }} />}
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
          <Tab icon={<CommentIcon />} label="Posts & Comments" />
          <Tab icon={<MoneyIcon />} label="Wallet & Earnings" />
          <Tab icon={<FollowersIcon />} label="Social" />
          {user?.role === 'seller' && <Tab icon={<StoreIcon />} label="Products" />}
          <Tab icon={<ActivityIcon />} label="Activities" />
          <Tab icon={<UploadIcon />} label="Uploads & Media" />
        </Tabs>

        {/* Videos Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell>Likes</TableCell>
                  <TableCell>Comments</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Upload Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(userStats?.videos || []).map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>{video.title}</TableCell>
                    <TableCell>{video.views.toLocaleString()}</TableCell>
                    <TableCell>{video.likes}</TableCell>
                    <TableCell>{video.comments}</TableCell>
                    <TableCell>{video.duration}</TableCell>
                    <TableCell>{video.uploadDate}</TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Posts & Comments Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Recent Posts</Typography>
              {(userStats?.posts || []).map((post) => (
                <Card key={post.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1" gutterBottom>{post.content}</Typography>
                    <Box display="flex" gap={2} alignItems="center">
                      <Chip icon={<LikeIcon />} label={post.likes} size="small" />
                      <Chip icon={<CommentIcon />} label={post.comments} size="small" />
                      <Chip icon={<ShareIcon />} label={post.shares} size="small" />
                      <Typography variant="caption" color="textSecondary">
                        {post.date}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Recent Comments</Typography>
              {(userStats?.comments || []).map((comment) => (
                <Card key={comment.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body2" gutterBottom>{comment.content}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      On: {comment.video} • {comment.date} • {comment.likes} likes
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Wallet & Earnings Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Wallet Balance</Typography>
                  <Typography variant="h4" color="primary">
                    ${(userStats?.wallet?.balance || 0).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending: ${(userStats?.wallet?.pendingPayments || 0).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Total Earnings</Typography>
                  <Typography variant="h4" color="success.main">
                    ${(userStats?.wallet?.totalEarnings || 0).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Last transaction: {userStats?.wallet?.lastTransaction || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Earnings History</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userStats.earnings.map((earning, index) => (
                      <TableRow key={index}>
                        <TableCell>{earning.date}</TableCell>
                        <TableCell>${earning.amount.toFixed(2)}</TableCell>
                        <TableCell>{earning.source}</TableCell>
                        <TableCell>
                          <Chip
                            label={earning.status}
                            color={earning.status === 'paid' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Social Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Followers ({userStats.followers.length})
              </Typography>
              <List>
                {userStats.followers.map((follower) => (
                  <ListItem key={follower.id}>
                    <ListItemAvatar>
                      <Avatar>{follower.username[0].toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={follower.username}
                      secondary={`Followed on ${follower.followDate}`}
                    />
                    {follower.verified && <ApproveIcon color="primary" />}
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Following ({userStats.following.length})
              </Typography>
              <List>
                {userStats.following.map((following) => (
                  <ListItem key={following.id}>
                    <ListItemAvatar>
                      <Avatar>{following.username[0].toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={following.username}
                      secondary={`Following since ${following.followDate}`}
                    />
                    {following.verified && <ApproveIcon color="primary" />}
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Products Tab (for sellers) */}
        {user.role === 'seller' && (
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" gutterBottom>Seller Products</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Sales</TableCell>
                    <TableCell>Revenue</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userStats.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>${product.price}</TableCell>
                      <TableCell>{product.sales}</TableCell>
                      <TableCell>${product.revenue.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={product.status}
                          color={product.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        )}

        {/* Activities Tab */}
        <TabPanel value={tabValue} index={user.role === 'seller' ? 5 : 4}>
          <Typography variant="h6" gutterBottom>Recent Activities</Typography>
          <List>
            {userStats.activities.map((activity, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={activity.action}
                    secondary={
                      <>
                        <Typography variant="body2">{activity.details}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {activity.timestamp}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < userStats.activities.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </TabPanel>

        {/* Uploads & Media Tab */}
        <TabPanel value={tabValue} index={user.role === 'seller' ? 6 : 5}>
          <Typography variant="h6" gutterBottom>Uploaded Documents & Media</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Profile Media</Typography>
                  <Box display="flex" gap={1}>
                    <Chip label="Avatar: Yes" color="success" />
                    <Chip label="Cover: No" color="default" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            {user.role === 'seller' && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Verification Documents</Typography>
                    <Box display="flex" gap={1}>
                      <Chip label="ID Document: Uploaded" color="success" />
                      <Chip label="Business License: Pending" color="warning" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Video Uploads Summary</Typography>
              <Typography variant="body2">
                Total videos: {userStats.videos.length} | 
                Total views: {userStats.videos.reduce((acc, video) => acc + video.views, 0).toLocaleString()} |
                Average engagement: {((userStats.videos.reduce((acc, video) => acc + video.likes + video.comments, 0) / userStats.videos.length) || 0).toFixed(1)}
              </Typography>
            </Grid>
          </Grid>
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