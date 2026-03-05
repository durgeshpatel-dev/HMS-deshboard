/**
 * Authentication Service for Managers
 */

import apiClient, { storage } from './api';
import { API_ENDPOINTS, DEMO_MANAGER } from '../config/api.config';

class AuthService {
  /**
   * Manager signup
   */
  async signup(data) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, data);
      return response.data;
    } catch (error) {
      // Fallback for demo - simulate signup
      console.log('Backend not available, using demo mode');
      return {
        success: true,
        message: 'Account created. Pending approval.',
        data: { manager_id: 'demo_manager_1' }
      };
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

      if (response.data.success && response.data.token) {
        storage.saveToken(response.data.token);
        storage.saveUser(response.data.user);
        return response.data;
      }

      throw new Error('Login failed');
    } catch (error) {
      console.log('Backend not available, using demo credentials');
      
      // Fallback to demo credentials
      if (email === DEMO_MANAGER.email && password === DEMO_MANAGER.password) {
        const demoResponse = {
          success: true,
          token: 'demo_token_manager_' + Date.now(),
          user: {
            id: 'demo_manager_1',
            email: DEMO_MANAGER.email,
            restaurant_name: 'Demo Restaurant',
            is_approved: true,
          },
        };
        storage.saveToken(demoResponse.token);
        storage.saveUser(demoResponse.user);
        return demoResponse;
      }

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
