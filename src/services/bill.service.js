import apiClient from './api';
import { API_ENDPOINTS } from '../config/api.config';

class BillService {
  async getBills(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.BILLS.GET_ALL, { params });
    return response.data;
  }

  async getBillById(id) {
    const response = await apiClient.get(API_ENDPOINTS.BILLS.GET_BY_ID(id));
    return response.data;
  }

  async getBillByOrder(orderId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BILLS.GET_BY_ORDER(orderId));
      return response.data;
    } catch (error) {
      if (error?.response?.status === 404) return null;
      throw error;
    }
  }

  async generateBill(orderId, payload = {}) {
    const response = await apiClient.post(API_ENDPOINTS.BILLS.GENERATE(orderId), payload);
    return response.data;
  }

  async recordPayment(id, payload) {
    const response = await apiClient.post(API_ENDPOINTS.BILLS.RECORD_PAYMENT(id), payload);
    return response.data;
  }

  async createShareLink(id) {
    const response = await apiClient.post(API_ENDPOINTS.BILLS.SHARE_LINK(id));
    return response.data;
  }
}

export default new BillService();
