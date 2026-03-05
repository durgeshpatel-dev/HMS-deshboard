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
   * Create parcel order
   */
  async createParcelOrder(data) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.ORDERS.CREATE_PARCEL, data);
      return response.data;
    } catch (error) {
      console.error('Failed to create parcel order:', error);
      throw error;
    }
  }

  /**
   * Complete order (manager only)
   */
  async completeOrder(id, paymentData) {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.ORDERS.COMPLETE(id),
        paymentData
      );
      return response.data;
    } catch (error) {
      console.error('Failed to complete order:', error);
      throw error;
    }
  }
}

export default new OrderService();
