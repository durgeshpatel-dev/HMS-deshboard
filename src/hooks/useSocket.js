import { useEffect } from 'react';
import React from 'react';
import SocketService from '../services/socket.service';

/**
 * Hook to subscribe to Socket.io events
 * Usage: useSocket('order:updated', (data) => { ... })
 */
export const useSocket = (event, callback) => {
  useEffect(() => {
    if (!callback) return;

    const unsubscribe = SocketService.on(event, callback);

    return () => {
      unsubscribe();
    };
  }, [event, callback]);
};

/**
 * Hook to get Socket.io connection status
 */
export const useSocketConnected = () => {
  const [connected, setConnected] = React.useState(SocketService.isConnected());

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    SocketService.on('socket:connected', handleConnect);
    SocketService.on('socket:disconnected', handleDisconnect);

    return () => {
      SocketService.off('socket:connected', handleConnect);
      SocketService.off('socket:disconnected', handleDisconnect);
    };
  }, []);

  return connected;
};

export default useSocket;
