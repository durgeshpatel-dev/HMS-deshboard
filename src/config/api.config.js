/**
 * API Configuration for Web Dashboard
 */

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Socket.io URL
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// API Timeout
export const API_TIMEOUT = 30000; // 30 seconds

// API Endpoints
export const API_ENDPOINTS = {
  // Manager Authentication
  AUTH: {
    SIGNUP: '/auth/manager/signup',
    LOGIN: '/auth/manager/login',
    VERIFY_SIGNUP_OTP: '/auth/manager/verify-signup-otp',
    RESEND_SIGNUP_OTP: '/auth/manager/resend-signup-otp',
    FORGOT_PASSWORD: '/auth/manager/forgot-password',
    RESET_PASSWORD: '/auth/manager/reset-password',
    LOGOUT: '/auth/logout',
  },

  // Phase 3 backend currently does not include manager staff CRUD APIs
  STAFF: {
    GET_ALL: '/manager/staff',
    CREATE: '/manager/staff',
    UPDATE: (id) => `/manager/staff/${id}`,
    DELETE: (id) => `/manager/staff/${id}`,
  },

  // Menu Management (Phase 3)
  MENU: {
    CATEGORIES: {
      GET_ALL: '/menu/categories',
      CREATE: '/menu/categories',
      UPDATE: (id) => `/menu/categories/${id}`,
      DELETE: (id) => `/menu/categories/${id}`,
    },
    ITEMS: {
      GET_ALL: '/menu/items',
      CREATE: '/menu/items',
      UPDATE: (id) => `/menu/items/${id}`,
      DELETE: (id) => `/menu/items/${id}`,
      AVAILABILITY: (id) => `/menu/items/${id}/availability`,
    },
  },

  // Tables (Phase 3)
  TABLES: {
    GET_ALL: '/tables',
    GET_AVAILABLE: '/tables/available',
    GET_BY_ID: (id) => `/tables/${id}`,
    GET_STATS: '/tables/stats',
    CREATE: '/tables',
    UPDATE: (id) => `/tables/${id}`,
    UPDATE_STATUS: (id) => `/tables/${id}/status`,
    DELETE: (id) => `/tables/${id}`,
  },

  // Orders (Phase 3)
  ORDERS: {
    GET_ALL: '/orders',
    GET_BY_ID: (id) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE: (id) => `/orders/${id}`,
    ADD_ITEMS: (id) => `/orders/${id}/items`,
    UPDATE_ITEM: (orderId, itemId) => `/orders/${orderId}/items/${itemId}`,
    DELETE_ITEM: (orderId, itemId) => `/orders/${orderId}/items/${itemId}`,
    KITCHEN: '/orders/kitchen',
    MY_ORDERS: '/orders/my-orders',
  },

  BILLS: {
    GET_ALL: '/bills',
    GET_BY_ID: (id) => `/bills/${id}`,
    GET_BY_ORDER: (orderId) => `/bills/order/${orderId}`,
    GENERATE: (orderId) => `/bills/order/${orderId}/generate`,
    RECORD_PAYMENT: (id) => `/bills/${id}/payment`,
    SHARE_LINK: (id) => `/bills/${id}/share-link`,
  },

  // Reports are currently computed from order APIs in frontend
  REPORTS: {
    // DAILY: '/manager/reports/daily',
    // WEEKLY: '/manager/reports/weekly',
    // MONTHLY: '/manager/reports/monthly',
    // CUSTOM: '/manager/reports/custom',
    // EXPORT: '/manager/reports/export',
  },
};
