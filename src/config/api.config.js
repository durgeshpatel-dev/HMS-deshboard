/**
 * API Configuration for Web Dashboard
 */

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Socket.io URL
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// API Timeout
export const API_TIMEOUT = 30000; // 30 seconds

// Demo credentials for testing
export const DEMO_MANAGER = {
  email: 'manager@demo.com',
  password: 'manager123',
  name: 'Demo Manager'
};

// API Endpoints
export const API_ENDPOINTS = {
  // Manager Authentication
  AUTH: {
    SIGNUP: '/auth/manager/signup',
    LOGIN: '/auth/manager/login',
    LOGOUT: '/auth/manager/logout',
  },
  
  // Staff Management
  STAFF: {
    GET_ALL: '/manager/staff',
    CREATE: '/manager/staff',
    UPDATE: (id) => `/manager/staff/${id}`,
    DELETE: (id) => `/manager/staff/${id}`,
  },
  
  // Menu Management
  MENU: {
    GET_ALL: '/menu',
    CREATE: '/manager/menu',
    UPDATE: (id) => `/manager/menu/${id}`,
    DELETE: (id) => `/manager/menu/${id}`,
  },
  
  // Tables
  TABLES: {
    GET_ALL: '/tables',
    CREATE: '/manager/tables',
    UPDATE: (id) => `/tables/${id}`,
  },
  
  // Orders
  ORDERS: {
    GET_ALL: '/orders',
    GET_BY_ID: (id) => `/orders/${id}`,
    CREATE_PARCEL: '/manager/orders/parcel',
    COMPLETE: (id) => `/orders/${id}/complete`,
  },
  
  // Reports
  REPORTS: {
    DAILY: '/manager/reports/daily',
    WEEKLY: '/manager/reports/weekly',
    MONTHLY: '/manager/reports/monthly',
    CUSTOM: '/manager/reports/custom',
    EXPORT: '/manager/reports/export',
  },
};
