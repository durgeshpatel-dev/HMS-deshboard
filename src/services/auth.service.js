/**
 * Authentication Service for Managers
 */

import apiClient, { storage } from './api';
import { API_ENDPOINTS } from '../config/api.config';

class AuthService {
  /**
   * Manager signup
   */
  async signup(data) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Signup failed');
    }
  }

  /**
   * Manager login
   */
  async login(email, password) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      const payload = response.data?.data || response.data;
      const accessToken = payload?.tokens?.accessToken || payload?.token;
      const user = payload?.user;

      if (response.data?.success && accessToken && user) {
        storage.saveToken(accessToken);
        storage.saveUser(user);
        return {
          ...response.data,
          user,
          token: accessToken,
        };
      }

      throw new Error('Login failed');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Invalid email or password');
    }
  }

  /**
   * Manager logout
   */
  async logout() {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      storage.clearAll();
    }
  }

  /**
   * Get current user from storage
   */
  getCurrentUser() {
    return storage.getUser();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!storage.getToken();
  }
}

export default new AuthService();
