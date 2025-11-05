import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContextFirebase';

// Components
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import SellerApplications from './pages/SellerApplications';
import ApplicationDetails from './pages/ApplicationDetails';
import CreateUser from './pages/CreateUser';
import Analytics from './pages/Analytics';

// E-commerce Pages
import Products from './pages/Products';
import Stores from './pages/Stores';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Coupons from './pages/Coupons';
import Shipping from './pages/Shipping';
import CustomerSupport from './pages/CustomerSupport';

// New Phase 10 Pages
import ContentManager from './pages/ContentManager';
import PlatformAnalytics from './pages/PlatformAnalytics';

// Phase 14: Media Management Pages
import MediaBrowser from './pages/MediaBrowser';
import SoundManager from './pages/SoundManager';
import TrendingControls from './pages/TrendingControls';
import ProcessingQueue from './pages/ProcessingQueue';
import StorageStats from './pages/StorageStats';

// Admin Dashboard Gap-Filling Pages
import Settings from './pages/Settings';
import Livestreams from './pages/Livestreams';
import Moderation from './pages/Moderation';
import Monetization from './pages/Monetization';
import Wallets from './pages/Wallets';
import Notifications from './pages/Notifications';

// Content & Economy Management Pages
import Videos from './pages/Videos';
import Gifts from './pages/Gifts';
import APISettings from './pages/APISettings';
import Posts from './pages/Posts';
import Stories from './pages/Stories';
import Coins from './pages/Coins';
import Levels from './pages/Levels';
import Banners from './pages/Banners';
import Tags from './pages/Tags';
import Explorer from './pages/Explorer';
import Featured from './pages/Featured';

// New Missing Pages
import CommentsManagement from './pages/CommentsManagement';
import TranslationsManagement from './pages/TranslationsManagement';
import UploadManager from './pages/UploadManager';
import CurrenciesManagement from './pages/CurrenciesManagement';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } 
        />
      
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <ErrorBoundary>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/:id" element={<UserDetails />} />
                <Route path="/seller-applications" element={<SellerApplications />} />
                <Route path="/seller-applications/:id" element={<ApplicationDetails />} />
                <Route path="/create-user" element={<CreateUser />} />
                
                {/* E-commerce Routes */}
                <Route path="/products" element={<Products />} />
                <Route path="/stores" element={<Stores />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/coupons" element={<Coupons />} />
                <Route path="/shipping" element={<Shipping />} />
                <Route path="/support" element={<CustomerSupport />} />
                
                <Route path="/analytics" element={<Analytics />} />
                
                {/* Phase 10: Content & Platform Management */}
                <Route path="/content" element={<ContentManager />} />
                <Route path="/platform-analytics" element={<PlatformAnalytics />} />
                
                {/* Phase 14: Media Management */}
                <Route path="/media-browser" element={<MediaBrowser />} />
                <Route path="/sound-manager" element={<SoundManager />} />
                <Route path="/trending-controls" element={<TrendingControls />} />
                <Route path="/processing-queue" element={<ProcessingQueue />} />
                <Route path="/storage-stats" element={<StorageStats />} />
                
                {/* Admin Dashboard Gap-Filling */}
                <Route path="/settings" element={<Settings />} />
                <Route path="/livestreams" element={<Livestreams />} />
                <Route path="/moderation" element={<Moderation />} />
                <Route path="/monetization" element={<Monetization />} />
                <Route path="/wallets" element={<Wallets />} />
                <Route path="/notifications" element={<Notifications />} />
                
                {/* Content & Economy Management */}
                <Route path="/videos" element={<Videos />} />
                <Route path="/posts" element={<Posts />} />
                <Route path="/stories-manage" element={<Stories />} />
                <Route path="/gifts" element={<Gifts />} />
                <Route path="/coins" element={<Coins />} />
                <Route path="/levels" element={<Levels />} />
                
                {/* Discovery & Marketing */}
                <Route path="/tags" element={<Tags />} />
                <Route path="/explorer" element={<Explorer />} />
                <Route path="/featured" element={<Featured />} />
                <Route path="/banners" element={<Banners />} />
                
                {/* System Configuration */}
                <Route path="/api-settings" element={<APISettings />} />
                
                {/* New Missing Pages */}
                <Route path="/comments-management" element={<CommentsManagement />} />
                <Route path="/translations" element={<TranslationsManagement />} />
                <Route path="/upload-manager" element={<UploadManager />} />
                <Route path="/currencies" element={<CurrenciesManagement />} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
    </Routes>
    </>
  );
}

export default App;