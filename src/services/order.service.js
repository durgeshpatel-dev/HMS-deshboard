/**
 * Order Service
 */

import apiClient from './api';
import { API_ENDPOINTS } from '../config/api.config';

class OrderService {
  /**
   * Get all orders with filters
   */
  async getOrders(params = {}) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ORDERS.GET_ALL, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ORDERS.GET_BY_ID(id));
      return response.data;
    } catch (error) {
      console.error('Failed to fetch order:', error);
      throw error;
    }
  }

  /**
   * Create order
   */
  async createOrder(data) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.ORDERS.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  /**
   * Update order status/details
   */
  async updateOrder(id, data) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.ORDERS.UPDATE(id), data);
      return response.data;
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  }

  async addItems(id, data) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.ORDERS.ADD_ITEMS(id), data);
      return response.data;
    } catch (error) {
      console.error('Failed to add order items:', error);
      throw error;
    }
  }

  async updateItem(orderId, itemId, data) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.ORDERS.UPDATE_ITEM(orderId, itemId), data);
      return response.data;
    } catch (error) {
      console.error('Failed to update order item:', error);
      throw error;
    }
  }

  async deleteItem(orderId, itemId) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.ORDERS.DELETE_ITEM(orderId, itemId));
      return response.data;
    } catch (error) {
      console.error('Failed to delete order item:', error);
      throw error;
    }
  }
}

export default new OrderService();
