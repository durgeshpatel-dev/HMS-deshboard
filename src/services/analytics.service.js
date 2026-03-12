/**
 * Analytics Service - Dashboard
 * Handles all report and analytics API calls
 */

import apiClient from './api';

const API_ENDPOINTS = {
  SALES_ANALYTICS: '/analytics/sales',
  TOP_ITEMS: '/analytics/top-items',
  ORDER_SUMMARY: '/analytics/order-summary',
  PAYMENT_BREAKDOWN: '/analytics/payment-breakdown',
  WAITER_PERFORMANCE: '/analytics/waiter-performance',
};

class AnalyticsService {
  /**
   * Get sales analytics for chart visualization
   */
  async getSalesAnalytics(startDate, endDate, groupBy = 'day') {
    const response = await apiClient.get(API_ENDPOINTS.SALES_ANALYTICS, {
      params: {
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        groupBy,
      },
    });
    return response.data;
  }

  /**
   * Get top selling items
   */
  async getTopItems(limit = 10, startDate, endDate) {
    const response = await apiClient.get(API_ENDPOINTS.TOP_ITEMS, {
      params: {
        limit,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
      },
    });
    return response.data;
  }

  /**
   * Get order summary (revenue, count, etc)
   */
  async getOrderSummary(startDate, endDate) {
    const response = await apiClient.get(API_ENDPOINTS.ORDER_SUMMARY, {
      params: {
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
      },
    });
    return response.data;
  }

  /**
   * Get payment method breakdown
   */
  async getPaymentBreakdown(startDate, endDate) {
    const response = await apiClient.get(API_ENDPOINTS.PAYMENT_BREAKDOWN, {
      params: {
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
      },
    });
    return response.data;
  }

  /**
   * Get waiter performance metrics
   */
  async getWaiterPerformance(limit = 10, startDate, endDate) {
    const response = await apiClient.get(API_ENDPOINTS.WAITER_PERFORMANCE, {
      params: {
        limit,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
      },
    });
    return response.data;
  }
}

export default new AnalyticsService();
