/**
 * MongoDB Authentication Context
 * Replaces Firebase authentication with JWT-based MongoDB auth
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import mongoAPI from '../utils/apiMongoDB';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('mongodb_jwt_token');
      const storedUser = localStorage.getItem('mongodb_user');

      if (!token) {
        setLoading(false);
        return;
      }

      // Try to get current user from API
      try {
        const response = await mongoAPI.auth.getCurrentUser();
        if (response.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Token expired or invalid
        if (storedUser) {
          // Use stored user data temporarily
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    try {
      const response = await mongoAPI.auth.login(identifier, password);

      if (response.success) {
        const { user } = response.data;
        
        // Check if user is admin
        if (user.role !== 'admin' && user.role !== 'superadmin') {
          toast.error('Access denied. Admin privileges required.');
          await mongoAPI.auth.logout();
          return { success: false, message: 'Not an admin' };
        }

        setUser(user);
        setIsAuthenticated(true);
        toast.success('Login successful!');
        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await mongoAPI.auth.logout();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state anyway
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

