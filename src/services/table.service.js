/**
 * Table Management Service
 */

import apiClient from './api';
import { API_ENDPOINTS } from '../config/api.config';

class TableService {
  async getTables() {
    const response = await apiClient.get(API_ENDPOINTS.TABLES.GET_ALL);
    return response.data;
  }

  async getAvailableTables() {
    const response = await apiClient.get(API_ENDPOINTS.TABLES.GET_AVAILABLE);
    return response.data;
  }

  async getTableStats() {
    const response = await apiClient.get(API_ENDPOINTS.TABLES.GET_STATS);
    return response.data;
  }

  async getTableById(id) {
    const response = await apiClient.get(API_ENDPOINTS.TABLES.GET_BY_ID(id));
    return response.data;
  }

  async createTable(data) {
    const response = await apiClient.post(API_ENDPOINTS.TABLES.CREATE, data);
    return response.data;
  }

  async updateTable(id, data) {
    const response = await apiClient.put(API_ENDPOINTS.TABLES.UPDATE(id), data);
    return response.data;
  }

  async updateTableStatus(id, status) {
    const response = await apiClient.patch(API_ENDPOINTS.TABLES.UPDATE_STATUS(id), { status });
    return response.data;
  }

  async deleteTable(id) {
    const response = await apiClient.delete(API_ENDPOINTS.TABLES.DELETE(id));
    return response.data;
  }
}

export default new TableService();
