import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.connecting = false;
    this.listeners = {};
  }

  connect(token) {
    if (this.connected || this.connecting) {
      return;
    }

    // If a stale socket instance exists, fully clean it up before reconnecting.
    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      } catch {
        // ignore cleanup errors
      }
      this.socket = null;
    }

    this.connecting = true;

    try {
      this.socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        transports: ['websocket', 'polling'],
      });

      this.setupEventListeners();

      console.log('Socket.io connecting...');
    } catch (error) {
      this.connecting = false;
      console.error('Socket.io connection error:', error);
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.connected = true;
      this.connecting = false;
      this.emit('socket:connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
      this.connecting = false;
      this.emit('socket:disconnected');
    });

    this.socket.on('connect_error', () => {
      this.connected = false;
      this.connecting = false;
    });

    this.socket.on('order:created', (data) => {
      this.emit('order:created', data);
    });

    this.socket.on('order:updated', (data) => {
      this.emit('order:updated', data);
    });

    this.socket.on('bill:created', (data) => {
      this.emit('bill:created', data);
    });

    this.socket.on('bill:updated', (data) => {
      this.emit('bill:updated', data);
    });

    // Backend emits 'table:updated' for all table mutations (create, update, status, delete)
    this.socket.on('table:updated', (data) => {
      this.emit('table:updated', data);
    });

    // Legacy alias kept for backward compat
    this.socket.on('table:status', (data) => {
      this.emit('table:updated', data);
    });

    this.socket.on('kitchen:alert', (data) => {
      this.emit('kitchen:alert', data);
    });

    // Menu & category mutations (create, update, delete, availability toggle)
    this.socket.on('menu:updated', (data) => {
      this.emit('menu:updated', data);
    });

    this.socket.on('category:updated', (data) => {
      this.emit('category:updated', data);
    });

    // Billing request from waiter
    this.socket.on('billing:request', (data) => {
      this.emit('billing:request', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socket:error', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      this.connecting = false;
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    };
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        callback(data);
      });
    }
  }

  // Socket.io emit methods for backend communication
  markOrderReady(orderId) {
    if (this.socket && this.connected) {
      this.socket.emit('order:markReady', { orderId });
    }
  }

  updateTableStatus(tableId, status) {
    if (this.socket && this.connected) {
      this.socket.emit('table:updateStatus', { tableId, status });
    }
  }

  sendKitchenAlert(message) {
    if (this.socket && this.connected) {
      this.socket.emit('kitchen:alert', { message });
    }
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

// Export singleton instance
export default new SocketService();
