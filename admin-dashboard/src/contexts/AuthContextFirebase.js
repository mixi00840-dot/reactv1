import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../utils/apiFirebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  firebaseUser: null,
  idToken: null,
  isAuthenticated: false,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        firebaseUser: action.payload.firebaseUser,
        idToken: action.payload.idToken,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        firebaseUser: null,
        idToken: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        firebaseUser: null,
        idToken: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'LOAD_USER':
      return {
        ...state,
        user: action.payload.user,
        firebaseUser: action.payload.firebaseUser,
        idToken: action.payload.idToken,
        isAuthenticated: true,
        loading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Wait for auth to be ready
          await auth.authStateReady();
          
          // Get Firebase ID token with validation
          let idToken;
          try {
            idToken = await firebaseUser.getIdToken(false);
            
            // Validate token format
            if (!idToken || typeof idToken !== 'string' || idToken.split('.').length !== 3) {
              throw new Error('Invalid token format');
            }
          } catch (tokenError) {
            console.error('Error getting ID token:', tokenError);
            // Try force refresh
            try {
              idToken = await firebaseUser.getIdToken(true);
              if (!idToken || typeof idToken !== 'string' || idToken.split('.').length !== 3) {
                throw new Error('Invalid token format after refresh');
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              toast.error('Authentication error. Please log in again.');
              await signOut(auth);
              dispatch({ type: 'AUTH_ERROR' });
              return;
            }
          }
          
          // Fetch user data from our backend
          const response = await api.get('/api/auth/firebase/me', {
            headers: {
              Authorization: `Bearer ${idToken}`
            }
          });
          
          const user = response.user;
          
          // Check if user is admin
          if (user.role !== 'admin') {
            toast.error('Access denied. Admin privileges required.');
            await signOut(auth);
            dispatch({ type: 'AUTH_ERROR' });
            return;
          }
          
          dispatch({ 
            type: 'LOAD_USER', 
            payload: { user, firebaseUser, idToken }
          });
        } catch (error) {
          console.error('Load user error:', error);
          
          // If it's a token error, sign out
          if (error.message?.includes('token') || error.response?.status === 401) {
            toast.error('Authentication error. Please log in again.');
            await signOut(auth);
          }
          
          dispatch({ type: 'AUTH_ERROR' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Set up token refresh
  useEffect(() => {
    if (!state.firebaseUser) return;

    // Refresh token every 50 minutes (Firebase tokens expire after 1 hour)
    const intervalId = setInterval(async () => {
      try {
        const newToken = await state.firebaseUser.getIdToken(true); // Force refresh
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { 
            user: state.user, 
            firebaseUser: state.firebaseUser, 
            idToken: newToken 
          }
        });
      } catch (error) {
        console.error('Token refresh error:', error);
        dispatch({ type: 'AUTH_ERROR' });
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(intervalId);
  }, [state.firebaseUser, state.user]);

  const login = async (loginData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Use Firebase Authentication to sign in
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginData.login, // Assuming email is provided
        loginData.password
      );
      
      const firebaseUser = userCredential.user;
      
      // Wait for auth to be ready
      await auth.authStateReady();
      
      // Get Firebase ID token with validation
      let idToken;
      try {
        idToken = await firebaseUser.getIdToken(false);
        
        // Validate token format (should have 3 parts: header.payload.signature)
        if (!idToken || typeof idToken !== 'string' || idToken.split('.').length !== 3) {
          console.error('Invalid token format received');
          throw new Error('Invalid token format');
        }
      } catch (tokenError) {
        console.error('Error getting ID token:', tokenError);
        // Try force refresh
        try {
          idToken = await firebaseUser.getIdToken(true);
          if (!idToken || typeof idToken !== 'string' || idToken.split('.').length !== 3) {
            throw new Error('Invalid token format after refresh');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          toast.error('Authentication error. Please try again.');
          await signOut(auth);
          dispatch({ type: 'AUTH_ERROR' });
          return false;
        }
      }
      
      // Get user profile from backend
      const response = await api.get('/api/auth/firebase/me', {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      const user = response.user;
      
      // Check if user is admin
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        await signOut(auth);
        dispatch({ type: 'AUTH_ERROR' });
        return false;
      }

      // Check if email is verified
      if (!firebaseUser.emailVerified) {
        toast.warning('Please verify your email address. Check your inbox.');
        // Allow login but show warning
      }

      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user, firebaseUser, idToken }
      });
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      let message = 'Login failed';
      
      // Handle Firebase auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'This account has been disabled. Contact support.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.message?.includes('token')) {
        message = 'Authentication error. Please try again.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      toast.error(message);
      dispatch({ type: 'AUTH_ERROR' });
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  const sendVerificationEmail = async () => {
    try {
      if (state.firebaseUser) {
        await sendEmailVerification(state.firebaseUser);
        toast.success('Verification email sent. Please check your inbox.');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Send verification email error:', error);
      toast.error('Failed to send verification email');
      return false;
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent. Please check your inbox.');
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      
      let message = 'Failed to send password reset email';
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if email exists for security
        message = 'If that email exists, a reset link has been sent.';
      }
      
      toast.error(message);
      return false;
    }
  };

  const value = {
    ...state,
    login,
    logout,
    sendVerificationEmail,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
