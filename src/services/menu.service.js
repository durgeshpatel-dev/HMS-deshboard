/**
 * Menu Service (real backend integration)
 */

import apiClient from './api';
import { API_ENDPOINTS } from '../config/api.config';

class MenuService {
  async getCategories() {
    const response = await apiClient.get(API_ENDPOINTS.MENU.CATEGORIES.GET_ALL);
    return response.data;
  }

  async createCategory(data) {
    const response = await apiClient.post(API_ENDPOINTS.MENU.CATEGORIES.CREATE, data);
    return response.data;
  }

  async updateCategory(id, data) {
    const response = await apiClient.put(API_ENDPOINTS.MENU.CATEGORIES.UPDATE(id), data);
    return response.data;
  }

  async deleteCategory(id) {
    const response = await apiClient.delete(API_ENDPOINTS.MENU.CATEGORIES.DELETE(id));
    return response.data;
  }

  async getItems() {
    const response = await apiClient.get(API_ENDPOINTS.MENU.ITEMS.GET_ALL);
    return response.data;
  }

  async createItem(data) {
    const response = await apiClient.post(API_ENDPOINTS.MENU.ITEMS.CREATE, data);
    return response.data;
  }

  async updateItem(id, data) {
    const response = await apiClient.put(API_ENDPOINTS.MENU.ITEMS.UPDATE(id), data);
    return response.data;
  }

  async deleteItem(id) {
    const response = await apiClient.delete(API_ENDPOINTS.MENU.ITEMS.DELETE(id));
    return response.data;
  }

  async toggleAvailability(id, isAvailable) {
    const response = await apiClient.patch(API_ENDPOINTS.MENU.ITEMS.AVAILABILITY(id), { isAvailable });
    return response.data;
  }
}

export default new MenuService();
