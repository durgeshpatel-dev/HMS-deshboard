/**
 * API Service for Web Dashboard
 * Axios instance with interceptors
 */

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/api.config';

const STORAGE_KEYS = {
  TOKEN: 'hms_manager_token',
  REFRESH_TOKEN: 'hms_manager_refresh_token',
  USER: 'hms_manager_user',
};

let refreshPromise = null;

const requestNewAccessToken = async () => {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    const nextAccessToken =
      response?.data?.data?.tokens?.accessToken ||
      response?.data?.data?.accessToken ||
      response?.data?.accessToken ||
      null;
    const nextRefreshToken =
      response?.data?.data?.tokens?.refreshToken ||
      response?.data?.data?.refreshToken ||
      null;

    if (!nextAccessToken) return null;

    localStorage.setItem(STORAGE_KEYS.TOKEN, nextAccessToken);
    if (nextRefreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, nextRefreshToken);
    }

    return nextAccessToken;
  } catch {
    return null;
  }
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const originalRequest = error.config;
      const requestUrl = String(originalRequest?.url || '');
      const isAuthEndpoint =
        requestUrl.includes('/auth/manager/login') ||
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes('/auth/logout');

      if (!isAuthEndpoint && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        refreshPromise = refreshPromise || requestNewAccessToken();
        const nextAccessToken = await refreshPromise;
        refreshPromise = null;

        if (nextAccessToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
          return apiClient(originalRequest);
        }
      }

      // Token expired or invalid - clear storage and redirect
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper functions for storage
export const storage = {
  saveToken: (token) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  },

  saveRefreshToken: (token) => {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },
  
  getToken: () => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  getRefreshToken: () => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  
  saveUser: (user) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  
  getUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },
  
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
};

export default apiClient;
