/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  // Listen for billing requests from waiters
  useSocket('billing:request', useCallback((data) => {
    const eventTs = Date.parse(data?.timestamp || '') || Date.now();

    setNotifications(prev => {
      const duplicate = prev.some((n) => {
        if (n.type !== 'billing_request') return false;
        const sameOrder = n.orderId && data?.orderId && Number(n.orderId) === Number(data.orderId);
        const sameTable = Number(n.tableId) === Number(data?.tableId);
        const nTs = Date.parse(n.timestamp || '') || 0;
        return (sameOrder || sameTable) && Math.abs(eventTs - nTs) < 10000;
      });

      if (duplicate) return prev;

      const notification = {
        id: `billing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'billing_request',
        title: `Table ${data.tableLabel || data.tableId} - Billing Request`,
        message: `${data.waiterName || 'Waiter'} requests billing • ${data.itemCount || 0} items • ₹${Number(data.total || 0).toFixed(2)}`,
        tableId: data.tableId,
        orderId: data.orderId,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
      };

      return [notification, ...prev];
    });

    // Play notification sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczJkq03vHSbjokSbTf8dJuOiRJtN/x0m46JEm03/HSbjokSbTf8dJuOiQ=');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch { /* audio not supported */ }
  }, []));

  // Listen for order updates — mark billing tables
  useSocket('order:updated', useCallback((data) => {
    // When an order moves to billing status, auto-add notification if not already present
    if (data?.status === 'billing' && data?.tableId) {
      setNotifications(prev => {
        const exists = prev.some(n => n.type === 'billing_request' && n.tableId === data.tableId && !n.read);
        if (exists) return prev;
        // Don't auto-add — the explicit billing:request event handles this
        return prev;
      });
    }
  }, []));

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

export default NotificationContext;
