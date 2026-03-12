/**
 * Settings Service - Dashboard
 * Handles restaurant settings, payment methods, and other configuration
 */

import apiClient from './api';

const API_ENDPOINTS = {
  GET_SETTINGS: '/settings',
  UPDATE_INFO: '/settings/info',
  UPDATE_SETTINGS: '/settings',
};

class SettingsService {
  /**
   * Get restaurant settings
   */
  async getRestaurantSettings() {
    const response = await apiClient.get(API_ENDPOINTS.GET_SETTINGS);
    return response.data;
  }

  /**
   * Update restaurant info (name, phone, email, address, etc)
   */
  async updateRestaurantInfo(data) {
    const response = await apiClient.put(API_ENDPOINTS.UPDATE_INFO, data);
    return response.data;
  }

  /**
   * Update restaurant settings (payment methods, opening/closing times, etc)
   */
  async updateRestaurantSettings(data) {
    const response = await apiClient.put(API_ENDPOINTS.UPDATE_SETTINGS, data);
    return response.data;
  }
}

export default new SettingsService();
