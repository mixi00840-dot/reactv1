import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  PersonAdd as PersonAddIcon,
  Analytics as AnalyticsIcon,
  AccountCircle,
  Logout,
  Notifications,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Campaign as CampaignIcon,
  Support as SupportIcon,
  VideoLibrary as VideoLibraryIcon,
  MusicNote as MusicNoteIcon,
  TrendingUp as TrendingUpIcon,
  Queue as QueueIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
  Videocam as VideocamIcon,
  Gavel as GavelIcon,
  AttachMoney as MoneyIcon,
  AccountBalanceWallet as WalletIcon,
  NotificationsActive as NotificationsActiveIcon,
  CardGiftcard as GiftIcon,
  Api as ApiIcon,
  Article as PostIcon,
  AutoStories as StoryIcon,
  MonetizationOn as CoinIcon,
  EmojiEvents as LevelIcon,
  ViewCarousel as BannerIcon,
  LocalOffer as TagIcon,
  Explore as ExploreIcon,
  Star as StarIcon,
  Comment as CommentIcon,
  Translate as TranslateIcon,
  CloudUpload as UploadIcon,
  AttachMoney as CurrencyIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiHealth from './ApiHealth';

const drawerWidth = 280;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
  },
  {
    text: 'Users',
    icon: <PeopleIcon />,
    path: '/users',
  },
  {
    text: 'Seller Applications',
    icon: <BusinessIcon />,
    path: '/seller-applications',
  },
  {
    text: 'Create User',
    icon: <PersonAddIcon />,
    path: '/create-user',
  },
  // Content Management
  {
    text: 'Content Manager',
    icon: <InventoryIcon />,
    path: '/content',
  },
  {
    text: 'Upload Manager',
    icon: <UploadIcon />,
    path: '/upload-manager',
  },
  {
    text: 'Comments Management',
    icon: <CommentIcon />,
    path: '/comments-management',
  },
  {
    text: 'Platform Analytics',
    icon: <AnalyticsIcon />,
    path: '/platform-analytics',
  },
  // Phase 14: Media Management
  {
    text: 'Media Browser',
    icon: <VideoLibraryIcon />,
    path: '/media-browser',
  },
  {
    text: 'Sound Manager',
    icon: <MusicNoteIcon />,
    path: '/sound-manager',
  },
  {
    text: 'Trending Controls',
    icon: <TrendingUpIcon />,
    path: '/trending-controls',
  },
  {
    text: 'Processing Queue',
    icon: <QueueIcon />,
    path: '/processing-queue',
  },
  {
    text: 'Storage Stats',
    icon: <StorageIcon />,
    path: '/storage-stats',
  },
  // Admin Management
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
  },
  {
    text: 'Livestreams',
    icon: <VideocamIcon />,
    path: '/livestreams',
  },
  {
    text: 'Moderation',
    icon: <GavelIcon />,
    path: '/moderation',
  },
  {
    text: 'Monetization',
    icon: <MoneyIcon />,
    path: '/monetization',
  },
  {
    text: 'Wallets',
    icon: <WalletIcon />,
    path: '/wallets',
  },
  {
    text: 'Notifications',
    icon: <NotificationsActiveIcon />,
    path: '/notifications',
  },
  // Content & Social Management
  {
    text: 'Videos',
    icon: <VideoLibraryIcon />,
    path: '/videos',
  },
  {
    text: 'Posts',
    icon: <PostIcon />,
    path: '/posts',
  },
  {
    text: 'Stories',
    icon: <StoryIcon />,
    path: '/stories-manage',
  },
  // Economy & Gamification
  {
    text: 'Gifts',
    icon: <GiftIcon />,
    path: '/gifts',
  },
  {
    text: 'Coins',
    icon: <CoinIcon />,
    path: '/coins',
  },
  {
    text: 'User Levels',
    icon: <LevelIcon />,
    path: '/levels',
  },
  // Discovery & Marketing
  {
    text: 'Tags',
    icon: <TagIcon />,
    path: '/tags',
  },
  {
    text: 'Explorer',
    icon: <ExploreIcon />,
    path: '/explorer',
  },
  {
    text: 'Featured',
    icon: <StarIcon />,
    path: '/featured',
  },
  {
    text: 'Banners',
    icon: <BannerIcon />,
    path: '/banners',
  },
  // System Configuration
  {
    text: 'API Settings',
    icon: <ApiIcon />,
    path: '/api-settings',
  },
  {
    text: 'Streaming Providers',
    icon: <VideocamIcon />,
    path: '/streaming-providers',
  },
  {
    text: 'Translations',
    icon: <TranslateIcon />,
    path: '/translations',
  },
  {
    text: 'Currencies',
    icon: <CurrencyIcon />,
    path: '/currencies',
  },
  // E-commerce Sections
  {
    text: 'Products',
    icon: <InventoryIcon />,
    path: '/products',
  },
  {
    text: 'Stores',
    icon: <StoreIcon />,
    path: '/stores',
  },
  {
    text: 'Orders',
    icon: <ShoppingCartIcon />,
    path: '/orders',
  },
  {
    text: 'Payments',
    icon: <PaymentIcon />,
    path: '/payments',
  },
  {
    text: 'Coupons & Promotions',
    icon: <CampaignIcon />,
    path: '/coupons',
  },
  {
    text: 'Shipping',
    icon: <ShippingIcon />,
    path: '/shipping',
  },
  {
    text: 'Customer Support',
    icon: <SupportIcon />,
    path: '/support',
  },
  {
    text: 'Analytics',
    icon: <AnalyticsIcon />,
    path: '/analytics',
  },
];

function Layout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ px: 3 }}>
        <Typography variant="h6" noWrap component="div" color="primary" fontWeight="bold">
          Mixillo Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ px: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Admin Panel'}
          </Typography>

          <ApiHealth />
          <IconButton color="inherit" sx={{ mr: 2, ml: 2 }}>
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar
              sx={{ width: 32, height: 32 }}
              src={user?.avatar}
              alt={user?.fullName}
            >
              {user?.fullName?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout;