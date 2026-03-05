/**
 * Reports Service
 */

import apiClient from './api';
import { API_ENDPOINTS } from '../config/api.config';

class ReportService {
  /**
   * Get daily report
   */
  async getDailyReport(date = null) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.REPORTS.DAILY, {
        params: date ? { date } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch daily report:', error);
      throw error;
    }
  }

  /**
   * Get weekly report
   */
  async getWeeklyReport(weekStart = null) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.REPORTS.WEEKLY, {
        params: weekStart ? { week_start: weekStart } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch weekly report:', error);
      throw error;
    }
  }

  /**
   * Get monthly report
   */
  async getMonthlyReport(month = null) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.REPORTS.MONTHLY, {
        params: month ? { month } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch monthly report:', error);
      throw error;
    }
  }

  /**
   * Get custom date range report
   */
  async getCustomReport(fromDate, toDate, filters = {}) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.REPORTS.CUSTOM, {
        params: {
          from_date: fromDate,
          to_date: toDate,
          ...filters,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch custom report:', error);
      throw error;
    }
  }

  /**
   * Export report as CSV
   */
  async exportReport(fromDate, toDate, filters = {}) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.REPORTS.EXPORT, {
        params: {
          from_date: fromDate,
          to_date: toDate,
          ...filters,
        },
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${fromDate}-to-${toDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to export report:', error);
      throw error;
    }
  }
}

export default new ReportService();
