/**
 * Staff Management Service
 */

import apiClient from './api';
import { API_ENDPOINTS } from '../config/api.config';

class StaffService {
  /**
   * Get all staff members
   */
  async getStaff(role = null) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.STAFF.GET_ALL, {
        params: role ? { role } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      throw error;
    }
  }

  /**
   * Create new staff member
   */
  async createStaff(data) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.STAFF.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('Failed to create staff:', error);
      throw error;
    }
  }

  /**
   * Update staff member
   */
  async updateStaff(id, data) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.STAFF.UPDATE(id), data);
      return response.data;
    } catch (error) {
      console.error('Failed to update staff:', error);
      throw error;
    }
  }

  /**
   * Delete staff member
   */
  async deleteStaff(id) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.STAFF.DELETE(id));
      return response.data;
    } catch (error) {
      console.error('Failed to delete staff:', error);
      throw error;
    }
  }
}

export default new StaffService();
