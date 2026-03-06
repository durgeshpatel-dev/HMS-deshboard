/**
 * Authentication Context - Optimized with proper error handling
 * Premium implementation with loading states and error boundaries
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import SocketService from '../services/socket.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Reconnect socket if user is already logged in (page refresh)
        const token = AuthService.isAuthenticated() ? localStorage.getItem('hms_manager_token') : null;
        if (token && !SocketService.isConnected()) {
          SocketService.connect(token);
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.login(email, password);

      const status = response?.user?.status;
      if (status && status !== 'active') {
        if (status === 'pending_approval') {
          throw new Error('Your account is pending approval');
        }
        if (status === 'rejected') {
          throw new Error('Your account application was rejected');
        }
        if (status === 'suspended') {
          throw new Error('Your account has been suspended');
        }
      }
      
      setUser(response.user);
      
      // Connect Socket.io after successful login
      if (response.token) {
        SocketService.connect(response.token);
      }
      
      return response;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.signup(data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await AuthService.logout();
      setUser(null);
      
      // Disconnect Socket.io on logout
      SocketService.disconnect();
      
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    signup,
    logout,
    clearError,
    isAuthenticated: !!user,
  }), [user, loading, error, login, signup, logout, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
