# HMS Dashboard - API & Socket.IO Implementation Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [API Configuration](#api-configuration)
3. [Socket.IO Implementation](#socketio-implementation)
4. [Service Layer Patterns](#service-layer-patterns)
5. [Frontend Integration](#frontend-integration)
6. [Error Handling](#error-handling)
7. [Authentication Flow](#authentication-flow)
8. [Best Practices](#best-practices)

---

## Architecture Overview

### Tech Stack
- **Frontend**: React + Vite
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks

### Project Structure
```
src/
├── config/
│   └── api.config.js          # API endpoints & configuration
├── services/
│   ├── api.js                 # Axios instance & interceptors
│   ├── socket.service.js      # Socket.IO service
│   ├── auth.service.js        # Authentication API
│   ├── menu.service.js        # Menu management API
│   ├── order.service.js       # Orders API
│   ├── staff.service.js       # Staff management API
│   └── bill.service.js        # Billing API
├── hooks/
│   ├── useAPI.js              # API request hooks
│   └── useSocket.js           # Socket event hooks
└── contexts/
    └── AuthContext.jsx        # Auth state management
```

---

## API Configuration

### 1. Base Configuration (`src/config/api.config.js`)

```javascript
/**
 * API Configuration for Web Dashboard
 */

// API Base URL - Use environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
export const API_TIMEOUT = 30000; // 30 seconds

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNUP: '/auth/manager/signup',
    LOGIN: '/auth/manager/login',
    LOGOUT: '/auth/manager/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },

  // Staff Management
  STAFF: {
    GET_ALL: '/manager/staff',
    GET_BY_ID: (id) => `/manager/staff/${id}`,
    CREATE: '/manager/staff',
    UPDATE: (id) => `/manager/staff/${id}`,
    DELETE: (id) => `/manager/staff/${id}`,
    SEARCH: '/manager/staff/search',  // Fuzzy search endpoint
  },

  // Menu Management
  MENU: {
    CATEGORIES: {
      GET_ALL: '/menu/categories',
      GET_BY_ID: (id) => `/menu/categories/${id}`,
      CREATE: '/menu/categories',
      UPDATE: (id) => `/menu/categories/${id}`,
      DELETE: (id) => `/menu/categories/${id}`,
      SEARCH: '/menu/categories/search',
    },
    ITEMS: {
      GET_ALL: '/menu/items',
      GET_BY_ID: (id) => `/menu/items/${id}`,
      CREATE: '/menu/items',
      UPDATE: (id) => `/menu/items/${id}`,
      DELETE: (id) => `/menu/items/${id}`,
      AVAILABILITY: (id) => `/menu/items/${id}/availability`,
      SEARCH: '/menu/items/search',  // Fuzzy search endpoint
      FILTER: '/menu/items/filter',
    },
  },

  // Tables
  TABLES: {
    GET_ALL: '/tables',
    GET_BY_ID: (id) => `/tables/${id}`,
    GET_STATS: '/tables/stats',
    CREATE: '/tables',
    UPDATE: (id) => `/tables/${id}`,
    UPDATE_STATUS: (id) => `/tables/${id}/status',
    SEARCH: '/tables/search',
  },

  // Orders
  ORDERS: {
    GET_ALL: '/orders',
    GET_BY_ID: (id) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE: (id) => `/orders/${id}`,
    DELETE: (id) => `/orders/${id}`,
    ADD_ITEMS: (id) => `/orders/${id}/items',
    REMOVE_ITEM: (orderId, itemId) => `/orders/${orderId}/items/${itemId}`,
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
    SEARCH: '/orders/search',  // Fuzzy search endpoint
    FILTER: '/orders/filter',
    KITCHEN: '/orders/kitchen',
    MY_ORDERS: '/orders/my-orders',
    STATS: '/orders/stats',
  },

  // Bills
  BILLS: {
    GET_ALL: '/bills',
    GET_BY_ID: (id) => `/bills/${id}`,
    GET_BY_ORDER: (orderId) => `/bills/order/${orderId}`,
    GENERATE: (orderId) => `/bills/order/${orderId}/generate`,
    UPDATE: (id) => `/bills/${id}`,
    RECORD_PAYMENT: (id) => `/bills/${id}/payment`,
    SEARCH: '/bills/search',
    STATS: '/bills/stats',
  },

  // Reports
  REPORTS: {
    DAILY: '/manager/reports/daily',
    WEEKLY: '/manager/reports/weekly',
    MONTHLY: '/manager/reports/monthly',
    CUSTOM: '/manager/reports/custom',
    EXPORT: '/manager/reports/export',
    DASHBOARD: '/manager/reports/dashboard',
  },

  // Uploads
  UPLOAD: {
    IMAGE: '/upload/image',
    MENU_IMAGE: '/upload/menu-image',
  },
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Sort options
export const SORT_OPTIONS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  NAME: 'name',
  PRICE: 'price',
  DATE: 'date',
};
```

### 2. Environment Variables (`.env`)

```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000

# Optional: For different environments
# VITE_API_URL=https://api.production.com/api/v1
# VITE_SOCKET_URL=https://api.production.com
```

---

## Socket.IO Implementation

### 1. Socket Service (`src/services/socket.service.js`)

```javascript
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Socket.IO Service for Real-time Communication
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Event subscription management
 * - Authentication via JWT token
 * - Connection state tracking
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Connect to Socket.IO server
   * @param {string} token - JWT authentication token
   */
  connect(token) {
    if (this.connected && this.socket) {
      console.log('Socket already connected');
      return;
    }

    try {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      this.setupEventListeners();
      console.log('Socket.io initializing...');
    } catch (error) {
      console.error('Socket.io connection error:', error);
      this.emit('socket:error', error);
    }
  }

  /**
   * Setup core event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('socket:connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.connected = false;
      this.emit('socket:disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
      this.emit('socket:error', { 
        type: 'connection_error', 
        message: error.message,
        attempt: this.reconnectAttempts 
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      this.emit('socket:reconnected', { attemptNumber });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after maximum attempts');
      this.emit('socket:reconnect_failed');
    });

    // Server-side error handling
    this.socket.on('error', (error) => {
      console.error('Socket server error:', error);
      this.emit('socket:error', { type: 'server_error', error });
    });

    // Room management confirmations
    this.socket.on('room:joined', (data) => {
      console.log('Joined room:', data.room);
      this.emit('room:joined', data);
    });

    this.socket.on('room:left', (data) => {
      console.log('Left room:', data.room);
      this.emit('room:left', data);
    });

    // --- BUSINESS LOGIC EVENTS ---

    // Order Events
    this.socket.on('order:created', (data) => {
      console.log('📦 New order created:', data.orderId);
      this.emit('order:created', data);
    });

    this.socket.on('order:updated', (data) => {
      console.log('📝 Order updated:', data.orderId, 'Status:', data.status);
      this.emit('order:updated', data);
    });

    this.socket.on('order:status_changed', (data) => {
      console.log('🔄 Order status changed:', data.orderId, '→', data.status);
      this.emit('order:status_changed', data);
    });

    this.socket.on('order:deleted', (data) => {
      console.log('🗑️ Order deleted:', data.orderId);
      this.emit('order:deleted', data);
    });

    this.socket.on('order:item_added', (data) => {
      console.log('➕ Item added to order:', data.orderId);
      this.emit('order:item_added', data);
    });

    this.socket.on('order:item_removed', (data) => {
      console.log('➖ Item removed from order:', data.orderId);
      this.emit('order:item_removed', data);
    });

    // Bill Events
    this.socket.on('bill:created', (data) => {
      console.log('💰 Bill created:', data.billId);
      this.emit('bill:created', data);
    });

    this.socket.on('bill:updated', (data) => {
      console.log('💵 Bill updated:', data.billId);
      this.emit('bill:updated', data);
    });

    this.socket.on('bill:paid', (data) => {
      console.log('✅ Bill paid:', data.billId);
      this.emit('bill:paid', data);
    });

    // Table Events
    this.socket.on('table:status_changed', (data) => {
      console.log('🪑 Table status changed:', data.tableId, '→', data.status);
      this.emit('table:status_changed', data);
    });

    this.socket.on('table:occupied', (data) => {
      console.log('🪑 Table occupied:', data.tableId);
      this.emit('table:occupied', data);
    });

    this.socket.on('table:vacated', (data) => {
      console.log('🪑 Table vacated:', data.tableId);
      this.emit('table:vacated', data);
    });

    // Kitchen Events
    this.socket.on('kitchen:new_order', (data) => {
      console.log('👨‍🍳 New kitchen order:', data.orderId);
      this.emit('kitchen:new_order', data);
    });

    this.socket.on('kitchen:order_ready', (data) => {
      console.log('✅ Kitchen order ready:', data.orderId);
      this.emit('kitchen:order_ready', data);
    });

    this.socket.on('kitchen:alert', (data) => {
      console.log('🚨 Kitchen alert:', data.message);
      this.emit('kitchen:alert', data);
    });

    // Menu Events
    this.socket.on('menu:item_updated', (data) => {
      console.log('🍽️ Menu item updated:', data.itemId);
      this.emit('menu:item_updated', data);
    });

    this.socket.on('menu:item_availability', (data) => {
      console.log('📋 Menu item availability:', data.itemId, data.isAvailable);
      this.emit('menu:item_availability', data);
    });

    // Staff Events
    this.socket.on('staff:status_changed', (data) => {
      console.log('👤 Staff status changed:', data.staffId);
      this.emit('staff:status_changed', data);
    });

    // Notification Events
    this.socket.on('notification:new', (data) => {
      console.log('🔔 New notification:', data);
      this.emit('notification:new', data);
    });

    // System Events
    this.socket.on('system:maintenance', (data) => {
      console.log('🔧 System maintenance:', data.message);
      this.emit('system:maintenance', data);
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      this.socket = null;
      this.listeners.clear();
      console.log('Socket disconnected manually');
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  /**
   * Get socket ID
   */
  getSocketId() {
    return this.socket?.id || null;
  }

  // --- EVENT SUBSCRIPTION MANAGEMENT ---

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {function} callback - Event handler
   * @returns {function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {function} callback - Event handler to remove
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to local listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // --- ROOM MANAGEMENT ---

  /**
   * Join a room
   * @param {string} room - Room name
   */
  joinRoom(room) {
    if (this.socket) {
      this.socket.emit('room:join', { room });
    }
  }

  /**
   * Leave a room
   * @param {string} room - Room name
   */
  leaveRoom(room) {
    if (this.socket) {
      this.socket.emit('room:leave', { room });
    }
  }

  /**
   * Join manager dashboard room
   */
  joinManagerRoom() {
    this.joinRoom('manager:dashboard');
  }

  /**
   * Join kitchen room
   */
  joinKitchenRoom() {
    this.joinRoom('kitchen:display');
  }

  /**
   * Join specific table room
   * @param {string} tableId - Table ID
   */
  joinTableRoom(tableId) {
    this.joinRoom(`table:${tableId}`);
  }

  // --- EMIT EVENTS TO SERVER ---

  /**
   * Emit event to server
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitToServer(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit:', event);
    }
  }

  /**
   * Acknowledge order received
   * @param {string} orderId - Order ID
   */
  acknowledgeOrder(orderId) {
    this.emitToServer('order:acknowledge', { orderId });
  }

  /**
   * Update kitchen status
   * @param {string} orderId - Order ID
   * @param {string} status - Kitchen status
   */
  updateKitchenStatus(orderId, status) {
    this.emitToServer('kitchen:update_status', { orderId, status });
  }

  /**
   * Mark item as prepared
   * @param {string} orderId - Order ID
   * @param {string} itemId - Item ID
   */
  markItemPrepared(orderId, itemId) {
    this.emitToServer('kitchen:item_prepared', { orderId, itemId });
  }
}

// Export singleton instance
export default new SocketService();
```

### 2. Socket Hooks (`src/hooks/useSocket.js`)

```javascript
import { useEffect, useState, useCallback, useRef } from 'react';
import SocketService from '../services/socket.service';

/**
 * Hook to subscribe to Socket.io events
 * @param {string} event - Event name to listen for
 * @param {function} callback - Callback function when event occurs
 * 
 * @example
 * useSocket('order:updated', (data) => {
 *   console.log('Order updated:', data);
 *   refreshOrders();
 * });
 */
export const useSocket = (event, callback) => {
  useEffect(() => {
    if (!callback || !event) return;

    const unsubscribe = SocketService.on(event, callback);

    return () => {
      unsubscribe();
    };
  }, [event, callback]);
};

/**
 * Hook to get Socket.io connection status
 * @returns {boolean} Connection status
 * 
 * @example
 * const isConnected = useSocketConnected();
 * return (
 *   <div className={isConnected ? 'text-green-500' : 'text-red-500'}>
 *     {isConnected ? 'Connected' : 'Disconnected'}
 *   </div>
 * );
 */
export const useSocketConnected = () => {
  const [connected, setConnected] = useState(SocketService.isConnected());

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    const unsubConnect = SocketService.on('socket:connected', handleConnect);
    const unsubDisconnect = SocketService.on('socket:disconnected', handleDisconnect);

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, []);

  return connected;
};

/**
 * Hook for real-time order updates
 * @param {function} onOrderCreated - Callback for new orders
 * @param {function} onOrderUpdated - Callback for order updates
 * @param {function} onOrderStatusChanged - Callback for status changes
 * 
 * @example
 * useOrderSocket(
 *   (data) => toast.success(`New order #${data.orderId}`),
 *   (data) => updateOrderInList(data),
 *   (data) => showStatusChange(data)
 * );
 */
export const useOrderSocket = (onOrderCreated, onOrderUpdated, onOrderStatusChanged) => {
  useSocket('order:created', onOrderCreated);
  useSocket('order:updated', onOrderUpdated);
  useSocket('order:status_changed', onOrderStatusChanged);
};

/**
 * Hook for kitchen display real-time updates
 * @param {Object} callbacks - Callback functions for kitchen events
 * 
 * @example
 * useKitchenSocket({
 *   onNewOrder: (data) => playNotificationSound(),
 *   onOrderReady: (data) => showReadyAlert(data),
 *   onAlert: (data) => toast.warning(data.message)
 * });
 */
export const useKitchenSocket = ({
  onNewOrder,
  onOrderReady,
  onItemPrepared,
  onAlert,
} = {}) => {
  const hasJoinedRoom = useRef(false);

  useEffect(() => {
    if (!hasJoinedRoom.current) {
      SocketService.joinKitchenRoom();
      hasJoinedRoom.current = true;
    }

    return () => {
      // Optionally leave room on unmount
      // SocketService.leaveRoom('kitchen:display');
    };
  }, []);

  useSocket('kitchen:new_order', onNewOrder);
  useSocket('kitchen:order_ready', onOrderReady);
  useSocket('kitchen:item_prepared', onItemPrepared);
  useSocket('kitchen:alert', onAlert);
};

/**
 * Hook for table status updates
 * @param {function} onStatusChange - Callback for table status changes
 * @param {string[]} tableIds - Specific table IDs to monitor (optional)
 * 
 * @example
 * useTableSocket(
 *   (data) => updateTableStatus(data.tableId, data.status),
 *   ['table-1', 'table-2']
 * );
 */
export const useTableSocket = (onStatusChange, tableIds = []) => {
  useEffect(() => {
    // Join specific table rooms
    tableIds.forEach((tableId) => {
      SocketService.joinTableRoom(tableId);
    });

    return () => {
      tableIds.forEach((tableId) => {
        SocketService.leaveRoom(`table:${tableId}`);
      });
    };
  }, [tableIds]);

  useSocket('table:status_changed', onStatusChange);
  useSocket('table:occupied', onStatusChange);
  useSocket('table:vacated', onStatusChange);
};

/**
 * Hook for bill/payment updates
 * @param {Object} callbacks - Callback functions for bill events
 * 
 * @example
 * useBillSocket({
 *   onBillCreated: (data) => openBillModal(data),
 *   onBillPaid: (data) => showPaymentConfirmation(data)
 * });
 */
export const useBillSocket = ({
  onBillCreated,
  onBillUpdated,
  onBillPaid,
} = {}) => {
  useSocket('bill:created', onBillCreated);
  useSocket('bill:updated', onBillUpdated);
  useSocket('bill:paid', onBillPaid);
};

/**
 * Hook for notification handling
 * @param {function} onNotification - Callback for new notifications
 * @returns {Object} Notification control methods
 * 
 * @example
 * const { notifications, clearNotifications } = useNotifications(
 *   (data) => addNotification(data)
 * );
 */
export const useNotifications = (onNotification) => {
  const [notifications, setNotifications] = useState([]);

  const handleNotification = useCallback((data) => {
    const notification = {
      id: Date.now(),
      timestamp: new Date(),
      ...data,
    };
    setNotifications((prev) => [notification, ...prev]);
    onNotification?.(data);
  }, [onNotification]);

  useSocket('notification:new', handleNotification);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    clearNotifications,
    removeNotification,
  };
};

export default useSocket;
```

---

## Service Layer Patterns

### 1. Base API Service (`src/services/api.js`)

```javascript
/**
 * API Service - Axios Instance with Interceptors
 */

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/api.config';

const STORAGE_KEYS = {
  TOKEN: 'hms_manager_token',
  USER: 'hms_manager_user',
  REFRESH_TOKEN: 'hms_refresh_token',
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
    
    // Add request timestamp for debugging
    config.metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Log request duration in development
    if (import.meta.env.DEV && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt token refresh
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Token refresh failed - logout user
        storage.clearAll();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
      // Optionally redirect to unauthorized page
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// Storage helper functions
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
```

### 2. Service Class Pattern

```javascript
/**
 * Generic Service Class Pattern
 * Extend this for specific entity services
 */

import apiClient from './api';

class BaseService {
  constructor(baseEndpoint) {
    this.baseEndpoint = baseEndpoint;
  }

  // GET all items with optional filters
  async getAll(params = {}) {
    const response = await apiClient.get(this.baseEndpoint, { params });
    return response.data;
  }

  // GET single item by ID
  async getById(id) {
    const response = await apiClient.get(`${this.baseEndpoint}/${id}`);
    return response.data;
  }

  // POST create new item
  async create(data) {
    const response = await apiClient.post(this.baseEndpoint, data);
    return response.data;
  }

  // PUT update item
  async update(id, data) {
    const response = await apiClient.put(`${this.baseEndpoint}/${id}`, data);
    return response.data;
  }

  // PATCH partial update
  async patch(id, data) {
    const response = await apiClient.patch(`${this.baseEndpoint}/${id}`, data);
    return response.data;
  }

  // DELETE item
  async delete(id) {
    const response = await apiClient.delete(`${this.baseEndpoint}/${id}`);
    return response.data;
  }

  // Search with fuzzy matching
  async search(query, filters = {}) {
    const response = await apiClient.get(`${this.baseEndpoint}/search`, {
      params: { q: query, ...filters },
    });
    return response.data;
  }

  // Get paginated results
  async getPaginated(page = 1, limit = 20, filters = {}) {
    const response = await apiClient.get(this.baseEndpoint, {
      params: { page, limit, ...filters },
    });
    return response.data;
  }
}

export default BaseService;
```

### 3. Menu Service Example (`src/services/menu.service.js`)

```javascript
/**
 * Menu Service - Complete CRUD + Search Operations
 */

import apiClient from './api';
import { API_ENDPOINTS } from '../config/api.config';

class MenuService {
  // ============ CATEGORY OPERATIONS ============

  async getCategories(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.MENU.CATEGORIES.GET_ALL, { params });
    return response.data;
  }

  async getCategoryById(id) {
    const response = await apiClient.get(API_ENDPOINTS.MENU.CATEGORIES.GET_BY_ID(id));
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

  // ============ MENU ITEM OPERATIONS ============

  async getItems(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.MENU.ITEMS.GET_ALL, { params });
    return response.data;
  }

  async getItemById(id) {
    const response = await apiClient.get(API_ENDPOINTS.MENU.ITEMS.GET_BY_ID(id));
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
    const response = await apiClient.patch(
      API_ENDPOINTS.MENU.ITEMS.AVAILABILITY(id),
      { isAvailable }
    );
    return response.data;
  }

  // ============ SEARCH & FILTER OPERATIONS ============

  /**
   * Fuzzy search menu items
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {string} options.categoryId - Filter by category
   * @param {boolean} options.isAvailable - Filter by availability
   * @param {number} options.limit - Max results
   */
  async searchItems(query, options = {}) {
    const { categoryId, isAvailable, limit = 20 } = options;
    
    const response = await apiClient.get(API_ENDPOINTS.MENU.ITEMS.SEARCH, {
      params: {
        q: query,
        categoryId,
        isAvailable,
        limit,
      },
    });
    return response.data;
  }

  /**
   * Filter menu items
   * @param {Object} filters - Filter criteria
   */
  async filterItems(filters = {}) {
    const response = await apiClient.get(API_ENDPOINTS.MENU.ITEMS.FILTER, {
      params: filters,
    });
    return response.data;
  }

  /**
   * Get items by category
   * @param {string} categoryId - Category ID
   */
  async getItemsByCategory(categoryId) {
    return this.filterItems({ categoryId });
  }

  /**
   * Get popular items
   * @param {number} limit - Number of items to return
   */
  async getPopularItems(limit = 10) {
    const response = await apiClient.get(API_ENDPOINTS.MENU.ITEMS.GET_ALL, {
      params: { sortBy: 'popularity', limit },
    });
    return response.data;
  }
}

export default new MenuService();
```

### 4. Order Service with Advanced Features (`src/services/order.service.js`)

```javascript
/**
 * Order Service - Complete Order Management
 */

import apiClient from './api';
import { API_ENDPOINTS } from '../config/api.config';

class OrderService {
  // ============ CRUD OPERATIONS ============

  async getOrders(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.GET_ALL, { params });
    return response.data;
  }

  async getOrderById(id) {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.GET_BY_ID(id));
    return response.data;
  }

  async createOrder(data) {
    const response = await apiClient.post(API_ENDPOINTS.ORDERS.CREATE, data);
    return response.data;
  }

  async updateOrder(id, data) {
    const response = await apiClient.put(API_ENDPOINTS.ORDERS.UPDATE(id), data);
    return response.data;
  }

  async deleteOrder(id) {
    const response = await apiClient.delete(API_ENDPOINTS.ORDERS.DELETE(id));
    return response.data;
  }

  // ============ ORDER ITEMS ============

  async addItems(orderId, items) {
    const response = await apiClient.post(
      API_ENDPOINTS.ORDERS.ADD_ITEMS(orderId),
      { items }
    );
    return response.data;
  }

  async removeItem(orderId, itemId) {
    const response = await apiClient.delete(
      API_ENDPOINTS.ORDERS.REMOVE_ITEM(orderId, itemId)
    );
    return response.data;
  }

  // ============ STATUS MANAGEMENT ============

  async updateStatus(orderId, status) {
    const response = await apiClient.patch(
      API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId),
      { status }
    );
    return response.data;
  }

  // Status transition helpers
  async confirmOrder(orderId) {
    return this.updateStatus(orderId, 'confirmed');
  }

  async startPreparing(orderId) {
    return this.updateStatus(orderId, 'preparing');
  }

  async markReady(orderId) {
    return this.updateStatus(orderId, 'ready');
  }

  async completeOrder(orderId) {
    return this.updateStatus(orderId, 'completed');
  }

  async cancelOrder(orderId, reason) {
    const response = await apiClient.patch(
      API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId),
      { status: 'cancelled', reason }
    );
    return response.data;
  }

  // ============ SEARCH & FILTER ============

  /**
   * Fuzzy search orders
   * @param {string} query - Search query (order number, customer name, phone)
   * @param {Object} options - Search options
   */
  async searchOrders(query, options = {}) {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.SEARCH, {
      params: { q: query, ...options },
    });
    return response.data;
  }

  /**
   * Filter orders by criteria
   * @param {Object} filters - Filter options
   * @param {string} filters.status - Order status
   * @param {string} filters.orderType - 'dine-in' | 'parcel'
   * @param {string} filters.startDate - ISO date string
   * @param {string} filters.endDate - ISO date string
   * @param {string} filters.tableId - Table ID
   */
  async filterOrders(filters = {}) {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.FILTER, {
      params: filters,
    });
    return response.data;
  }

  /**
   * Get orders by status
   * @param {string} status - Order status
   */
  async getOrdersByStatus(status) {
    return this.filterOrders({ status });
  }

  /**
   * Get parcel orders only
   */
  async getParcelOrders() {
    return this.filterOrders({ orderType: 'parcel' });
  }

  /**
   * Get dine-in orders only
   */
  async getDineInOrders() {
    return this.filterOrders({ orderType: 'dine-in' });
  }

  // ============ KITCHEN OPERATIONS ============

  async getKitchenOrders() {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.KITCHEN);
    return response.data;
  }

  // ============ STATISTICS ============

  async getOrderStats(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.STATS, { params });
    return response.data;
  }

  // ============ PAGINATION ============

  async getOrdersPaginated(page = 1, limit = 20, filters = {}) {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.GET_ALL, {
      params: { page, limit, ...filters },
    });
    return response.data;
  }
}

export default new OrderService();
```

---

## Frontend Integration

### 1. API Hook (`src/hooks/useAPI.js`)

```javascript
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Generic API request hook with loading and error states
 * @param {function} apiFunction - API service function
 * @param {Object} options - Hook options
 * @param {boolean} options.immediate - Execute immediately
 * @param {*} options.initialData - Initial data value
 * 
 * @example
 * const { data, loading, error, execute, refresh } = useAPI(
 *   () => MenuService.getItems(),
 *   { immediate: true }
 * );
 */
export const useAPI = (apiFunction, options = {}) => {
  const { immediate = false, initialData = null } = options;
  
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to prevent stale closures
  const apiFunctionRef = useRef(apiFunction);
  apiFunctionRef.current = apiFunction;

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunctionRef.current(...args);
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    return execute();
  }, [execute]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    refresh,
    reset,
    setData,
  };
};

/**
 * Hook for paginated API requests
 * @param {function} apiFunction - API function that accepts { page, limit }
 * @param {Object} options - Options
 * 
 * @example
 * const {
 *   data,
 *   loading,
 *   page,
 *   setPage,
 *   totalPages,
 *   hasMore
 * } = usePaginatedAPI(
 *   (params) => OrderService.getOrdersPaginated(params.page, params.limit),
 *   { limit: 20 }
 * );
 */
export const usePaginatedAPI = (apiFunction, options = {}) => {
  const { limit = 20, immediate = false } = options;
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchData = useCallback(async (pageNum = page, append = false) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction({ page: pageNum, limit });
      
      const items = result.data || result.items || result;
      const totalItems = result.total || items.length;
      const pages = result.totalPages || Math.ceil(totalItems / limit);

      if (append) {
        setData((prev) => [...prev, ...items]);
      } else {
        setData(items);
      }

      setTotal(totalItems);
      setTotalPages(pages);
      setHasMore(pageNum < pages);
      
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiFunction, page, limit]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      return fetchData(nextPage, true);
    }
  }, [loading, hasMore, page, fetchData]);

  const refresh = useCallback(() => {
    setPage(1);
    return fetchData(1, false);
  }, [fetchData]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return {
    data,
    loading,
    error,
    page,
    setPage,
    totalPages,
    total,
    hasMore,
    loadMore,
    refresh,
    fetchData,
  };
};

/**
 * Hook for search with debouncing
 * @param {function} searchFunction - Search API function
 * @param {number} debounceMs - Debounce delay in milliseconds
 * 
 * @example
 * const { results, loading, search, clear } = useSearch(
 *   (query) => MenuService.searchItems(query),
 *   300
 * );
 */
export const useSearch = (searchFunction, debounceMs = 300) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  const search = useCallback((query, options = {}) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear results if query is empty
    if (!query || query.trim() === '') {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Debounce the search
    timeoutRef.current = setTimeout(async () => {
      try {
        const result = await searchFunction(query, options);
        setResults(result.data || result);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [searchFunction, debounceMs]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setResults([]);
    setLoading(false);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clear,
  };
};

export default useAPI;
```

### 2. Component Integration Examples

#### Menu Items with Search

```jsx
import { useState, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import MenuService from '../services/menu.service';
import { useSearch } from '../hooks/useAPI';
import { useSocket } from '../hooks/useSocket';

const MenuItems = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fuzzy search hook
  const { results: searchResults, loading: searchLoading, search, clear } = useSearch(
    (query) => MenuService.searchItems(query, { limit: 50 }),
    300
  );

  // Real-time updates via Socket.IO
  useSocket('menu:item_updated', useCallback((data) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === data.itemId ? { ...item, ...data.updates } : item
      )
    );
  }, []));

  useSocket('menu:item_availability', useCallback((data) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === data.itemId ? { ...item, isAvailable: data.isAvailable } : item
      )
    );
  }, []));

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      search(value);
    } else {
      clear();
    }
  };

  // Display search results or all items
  const displayItems = searchQuery.trim() ? searchResults : menuItems;

  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); clear(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
        {searchLoading && (
          <span className="absolute right-10 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            Searching...
          </span>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-sm text-gray-600 mb-4">
          Found {displayItems.length} result{displayItems.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayItems.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
```

#### Kitchen Display with Real-time Updates

```jsx
import { useState, useEffect, useCallback } from 'react';
import OrderService from '../services/order.service';
import SocketService from '../services/socket.service';
import { useKitchenSocket } from '../hooks/useSocket';

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await OrderService.getKitchenOrders();
        setOrders(response.data || []);
      } catch (error) {
        console.error('Failed to fetch kitchen orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    
    // Join kitchen room
    SocketService.joinKitchenRoom();

    return () => {
      SocketService.leaveRoom('kitchen:display');
    };
  }, []);

  // Real-time updates
  useKitchenSocket({
    onNewOrder: useCallback((data) => {
      setOrders((prev) => [data.order, ...prev]);
      // Play notification sound
      playNotificationSound();
    }, []),

    onOrderReady: useCallback((data) => {
      setOrders((prev) =>
        prev.filter((order) => order.id !== data.orderId)
      );
    }, []),

    onItemPrepared: useCallback((data) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.orderId
            ? {
                ...order,
                items: order.items.map((item) =>
                  item.id === data.itemId
                    ? { ...item, status: 'prepared' }
                    : item
                ),
              }
            : order
        )
      );
    }, []),

    onAlert: useCallback((data) => {
      toast.warning(data.message);
    }, []),
  });

  const handleMarkPrepared = async (orderId, itemId) => {
    try {
      // Optimistic update
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                items: order.items.map((item) =>
                  item.id === itemId ? { ...item, status: 'prepared' } : item
                ),
              }
            : order
        )
      );

      // Notify server via Socket.IO
      SocketService.markItemPrepared(orderId, itemId);
    } catch (error) {
      console.error('Failed to mark item prepared:', error);
    }
  };

  const handleOrderReady = async (orderId) => {
    try {
      await OrderService.updateStatus(orderId, 'ready');
      // Socket will handle the removal
    } catch (error) {
      console.error('Failed to mark order ready:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="kitchen-display">
      <h1>Kitchen Orders</h1>
      <div className="orders-grid">
        {orders.map((order) => (
          <KitchenOrderCard
            key={order.id}
            order={order}
            onMarkPrepared={handleMarkPrepared}
            onOrderReady={handleOrderReady}
          />
        ))}
      </div>
    </div>
  );
};
```

#### Orders with Fuzzy Search

```jsx
import { useState, useCallback } from 'react';
import OrderService from '../services/order.service';
import { useSearch } from '../hooks/useAPI';
import { useOrderSocket } from '../hooks/useSocket';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fuzzy search for orders
  const { results: searchResults, loading, search } = useSearch(
    (query, options) => OrderService.searchOrders(query, options),
    400
  );

  // Real-time order updates
  useOrderSocket(
    // onOrderCreated
    useCallback((data) => {
      setOrders((prev) => [data.order, ...prev]);
      toast.success(`New order received: #${data.order.orderNumber}`);
    }, []),

    // onOrderUpdated
    useCallback((data) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.orderId ? { ...order, ...data.updates } : order
        )
      );
    }, []),

    // onOrderStatusChanged
    useCallback((data) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.orderId ? { ...order, status: data.status } : order
        )
      );
    }, [])
  );

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (value.trim()) {
      search(value, { includeItems: true });
    }
  };

  const displayOrders = searchQuery.trim() ? searchResults : orders;

  return (
    <div className="orders-page">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by order #, customer name, or phone..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {loading && <span>Searching...</span>}
      </div>

      <OrdersTable orders={displayOrders} />
    </div>
  );
};
```

---

## Error Handling

### 1. Error Handler Utility

```javascript
/**
 * API Error Handler
 */

export class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const message = data?.message || data?.error || 'An error occurred';

    switch (status) {
      case 400:
        return { type: 'VALIDATION', message, status };
      case 401:
        return { type: 'AUTH', message: 'Session expired. Please login again.', status };
      case 403:
        return { type: 'FORBIDDEN', message: 'You do not have permission.', status };
      case 404:
        return { type: 'NOT_FOUND', message: 'Resource not found.', status };
      case 409:
        return { type: 'CONFLICT', message, status };
      case 422:
        return { type: 'VALIDATION', message, errors: data?.errors, status };
      case 429:
        return { type: 'RATE_LIMIT', message: 'Too many requests. Please try again.', status };
      case 500:
      case 502:
      case 503:
      case 504:
        return { type: 'SERVER', message: 'Server error. Please try again later.', status };
      default:
        return { type: 'UNKNOWN', message, status };
    }
  } else if (error.request) {
    // Request made but no response
    return { type: 'NETWORK', message: 'Network error. Check your connection.' };
  } else {
    // Error in request setup
    return { type: 'CLIENT', message: error.message };
  }
};

export const showErrorToast = (error, toast) => {
  const handled = handleAPIError(error);
  toast.error(handled.message);
  return handled;
};
```

### 2. Error Boundary Component

```jsx
import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

class APIErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('API Error Boundary caught:', error, errorInfo);
    
    // Send to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-8 text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default APIErrorBoundary;
```

---

## Authentication Flow

### 1. Auth Context (`src/contexts/AuthContext.jsx`)

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthService from '../services/auth.service';
import SocketService from '../services/socket.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = () => {
      const storedUser = AuthService.getCurrentUser();
      const token = AuthService.getToken();
      
      if (storedUser && token) {
        setUser(storedUser);
        setIsAuthenticated(true);
        
        // Connect Socket.IO
        SocketService.connect(token);
        SocketService.joinManagerRoom();
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await AuthService.login(email, password);
      
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        // Connect Socket.IO with new token
        SocketService.connect(response.token);
        SocketService.joinManagerRoom();
        
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    // Disconnect Socket.IO first
    SocketService.disconnect();
    
    // Clear auth state
    await AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      AuthService.saveUser(updated);
      return updated;
    });
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
```

---

## Best Practices

### 1. API Request Patterns

```javascript
// ✅ Good: Use service methods
const handleSubmit = async (data) => {
  setLoading(true);
  try {
    const result = await OrderService.createOrder(data);
    toast.success('Order created!');
    navigate(`/orders/${result.id}`);
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};

// ❌ Bad: Direct axios calls
const handleSubmit = async (data) => {
  const response = await axios.post('/api/orders', data); // Don't do this
};
```

### 2. Optimistic Updates

```javascript
const handleToggleAvailability = async (itemId) => {
  // Optimistic update
  const previousState = items.find((i) => i.id === itemId);
  setItems((prev) =>
    prev.map((item) =>
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    )
  );

  try {
    await MenuService.toggleAvailability(itemId, !previousState.isAvailable);
  } catch (error) {
    // Rollback on error
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? previousState : item
      )
    );
    toast.error('Failed to update availability');
  }
};
```

### 3. Request Cancellation

```javascript
import { useEffect, useRef } from 'react';
import axios from 'axios';

const useCancellableRequest = () => {
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cancel pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const makeRequest = async (requestFn) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      return await requestFn(abortControllerRef.current.signal);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled');
        return null;
      }
      throw error;
    }
  };

  return { makeRequest };
};
```

### 4. Loading States

```jsx
// ✅ Good: Multiple loading states
const [isCreating, setIsCreating] = useState(false);
const [isUpdating, setIsUpdating] = useState(false);

// ❌ Bad: Single loading state
const [loading, setLoading] = useState(false);
```

### 5. Socket.IO Room Management

```javascript
// Join rooms when component mounts
useEffect(() => {
  SocketService.joinManagerRoom();
  SocketService.joinKitchenRoom();

  return () => {
    // Leave rooms when unmounting
    SocketService.leaveRoom('manager:dashboard');
    SocketService.leaveRoom('kitchen:display');
  };
}, []);
```

---

## Backend API Requirements

### Required Backend Endpoints

#### Authentication
```
POST   /api/v1/auth/manager/signup
POST   /api/v1/auth/manager/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
```

#### Menu Management
```
GET    /api/v1/menu/categories
POST   /api/v1/menu/categories
PUT    /api/v1/menu/categories/:id
DELETE /api/v1/menu/categories/:id

GET    /api/v1/menu/items
POST   /api/v1/menu/items
PUT    /api/v1/menu/items/:id
DELETE /api/v1/menu/items/:id
PATCH  /api/v1/menu/items/:id/availability
GET    /api/v1/menu/items/search?q={query}  // Fuzzy search
GET    /api/v1/menu/items/filter
```

#### Orders
```
GET    /api/v1/orders
POST   /api/v1/orders
GET    /api/v1/orders/:id
PUT    /api/v1/orders/:id
DELETE /api/v1/orders/:id
POST   /api/v1/orders/:id/items
DELETE /api/v1/orders/:id/items/:itemId
PATCH  /api/v1/orders/:id/status
GET    /api/v1/orders/search?q={query}      // Fuzzy search
GET    /api/v1/orders/filter
GET    /api/v1/orders/kitchen
GET    /api/v1/orders/stats
```

#### Bills
```
GET    /api/v1/bills
GET    /api/v1/bills/:id
POST   /api/v1/bills/order/:orderId/generate
PATCH  /api/v1/bills/:id/payment
GET    /api/v1/bills/search
GET    /api/v1/bills/stats
```

#### Staff Management
```
GET    /api/v1/manager/staff
POST   /api/v1/manager/staff
PUT    /api/v1/manager/staff/:id
DELETE /api/v1/manager/staff/:id
GET    /api/v1/manager/staff/search?q={query}  // Fuzzy search
```

#### Tables
```
GET    /api/v1/tables
POST   /api/v1/tables
PUT    /api/v1/tables/:id
PATCH  /api/v1/tables/:id/status
GET    /api/v1/tables/stats
```

### Socket.IO Server Events to Emit

```javascript
// Order Events
socket.emit('order:created', { orderId, order });
socket.emit('order:updated', { orderId, updates });
socket.emit('order:status_changed', { orderId, status, previousStatus });
socket.emit('order:deleted', { orderId });
socket.emit('order:item_added', { orderId, item });
socket.emit('order:item_removed', { orderId, itemId });

// Bill Events
socket.emit('bill:created', { billId, bill });
socket.emit('bill:updated', { billId, updates });
socket.emit('bill:paid', { billId, paymentDetails });

// Table Events
socket.emit('table:status_changed', { tableId, status });
socket.emit('table:occupied', { tableId, orderId });
socket.emit('table:vacated', { tableId });

// Kitchen Events
socket.emit('kitchen:new_order', { orderId, order });
socket.emit('kitchen:order_ready', { orderId });
socket.emit('kitchen:item_prepared', { orderId, itemId });
socket.emit('kitchen:alert', { message, priority });

// Menu Events
socket.emit('menu:item_updated', { itemId, updates });
socket.emit('menu:item_availability', { itemId, isAvailable });

// Notification Events
socket.emit('notification:new', { 
  type, 
  title, 
  message, 
  data,
  timestamp: new Date()
});
```

---

## Summary

This guide provides a complete implementation pattern for:

1. **API Layer**: Axios instance with interceptors for auth, error handling, and logging
2. **Socket.IO**: Real-time communication with room management and event handling
3. **Services**: Organized API calls with consistent error handling
4. **Hooks**: Reusable hooks for data fetching, pagination, search, and Socket events
5. **Integration**: Component patterns for search, real-time updates, and optimistic UI

### Key Takeaways

- Use service classes to encapsulate API logic
- Implement fuzzy search endpoints in backend for better UX
- Use Socket.IO rooms to optimize real-time updates
- Always handle loading and error states
- Implement optimistic updates for better perceived performance
- Use debouncing for search inputs
- Clean up Socket.IO listeners on unmount

### Next Steps

1. Implement the fuzzy search endpoints in your backend
2. Set up Socket.IO rooms for different dashboard sections
3. Add request cancellation for better performance
4. Implement proper error tracking (Sentry, etc.)
5. Add request caching where appropriate
6. Implement offline support with service workers
