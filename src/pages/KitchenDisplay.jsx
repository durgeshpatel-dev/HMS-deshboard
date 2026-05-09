import { useEffect, useState, useCallback } from 'react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Clock, CheckCircle, AlertCircle, Flame, Wifi, WifiOff } from 'lucide-react';
import OrderService from '../services/order.service';
import useSocket from '../hooks/useSocket';
import SocketService from '../services/socket.service';

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [socketConnected, setSocketConnected] = useState(SocketService.isConnected());

  // Subscribe to real-time order updates
  useSocket('order:updated', (data) => {
    if (data?.id) {
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === data.id ? data : order))
      );
    }
  });

  // Subscribe to new order creation
  useSocket('order:created', (data) => {
    if (data && data.status !== 'completed' && data.status !== 'cancelled') {
      setOrders((prevOrders) => [...prevOrders, data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    }
  });

  // Subscribe to socket connection status
  useSocket('socket:connected', () => setSocketConnected(true));
  useSocket('socket:disconnected', () => setSocketConnected(false));

  const fetchOrders = useCallback(async () => {
    try {
      const response = await OrderService.getOrders();
      const kitchenOrders = response?.data?.filter(
        (o) => o.status !== 'completed' && o.status !== 'cancelled'
      ) || [];
      setOrders(kitchenOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } catch (error) {
      console.error('Failed to fetch kitchen orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    
    if (autoRefresh) {
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchOrders, autoRefresh]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Update both kitchenStatus AND status to keep them in sync
      const payload = { kitchenStatus: newStatus };
      if (newStatus === 'preparing') payload.status = 'preparing';
      if (newStatus === 'ready') payload.status = 'ready';
      await OrderService.updateOrder(orderId, payload);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-red-50 border-red-200 dark:bg-red-900/40 dark:border-red-800',
      preparing: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/40 dark:border-yellow-800',
      ready: 'bg-green-50 border-green-200 dark:bg-green-900/40 dark:border-green-800',
    };
    return colors[status] || 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'preparing':
        return <Flame className="w-5 h-5 text-yellow-600" />;
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getElapsedTime = (createdAt) => {
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}m ${seconds}s`;
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter((o) => o.kitchenStatus === filter);

  const pendingCount = orders.filter((o) => o.kitchenStatus === 'pending').length;
  const readyCount = orders.filter((o) => o.kitchenStatus === 'ready').length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header title="Kitchen Display System" />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Socket Connection Status */}
        <div className="mb-4 flex items-center gap-2">
          {socketConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-400 text-sm">Live Updates Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-red-400 text-sm">Using Polling (refresh every 5s)</span>
            </>
          )}
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-red-50 border-red-200 dark:bg-red-900/40 dark:border-red-800">
            <div className="p-4">
              <div className="text-3xl font-bold text-red-700 dark:text-red-400">{pendingCount}</div>
              <div className="text-red-600 dark:text-red-300 text-sm">Pending Orders</div>
            </div>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/40 dark:border-yellow-800">
            <div className="p-4">
              <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                {orders.filter((o) => o.kitchenStatus === 'preparing').length}
              </div>
              <div className="text-yellow-600 dark:text-yellow-300 text-sm">Preparing</div>
            </div>
          </Card>
          <Card className="bg-green-50 border-green-200 dark:bg-green-900/40 dark:border-green-800">
            <div className="p-4">
              <div className="text-3xl font-bold text-green-700 dark:text-green-400">{readyCount}</div>
              <div className="text-green-600 dark:text-green-300 text-sm">Ready for Pickup</div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All ({orders.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'primary' : 'secondary'}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </Button>
          <Button
            variant={filter === 'preparing' ? 'primary' : 'secondary'}
            onClick={() => setFilter('preparing')}
          >
            Preparing
          </Button>
          <Button
            variant={filter === 'ready' ? 'primary' : 'secondary'}
            onClick={() => setFilter('ready')}
          >
            Ready ({readyCount})
          </Button>
          <div className="flex-1"></div>
          <Button
            variant={autoRefresh ? 'primary' : 'secondary'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
          </Button>
        </div>

        {/* Kitchen Orders Grid */}
        {loading ? (
          <div className="text-center py-12">Loading kitchen orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No {filter !== 'all' ? filter : ''} orders to display
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className={`border-2 ${getStatusColor(order.kitchenStatus)}`}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.kitchenStatus)}
                      <span className="font-bold text-lg text-gray-900 dark:text-white">{order.orderNumber}</span>
                    </div>
                    <span className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                      {order.kitchenStatus || 'pending'}
                    </span>
                  </div>

                  {/* Order Type & Time */}
                  <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {order.orderType === 'dine_in' 
                        ? `Table ${order.table?.tableNumber || 'N/A'}`
                        : 'Parcel Order'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {getElapsedTime(order.createdAt)}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">ITEMS:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {order.items?.map((item) => (
                        <div key={item.id} className="text-sm text-gray-800 dark:text-gray-200">
                          <span className="font-semibold">{item.quantity}x</span>{' '}
                          {item.menuItem?.name || 'Item'}
                          {item.customizations?.specialInstructions && (
                            <div className="text-xs mt-1 italic text-gray-600 dark:text-gray-400">
                              Note: {item.customizations.specialInstructions}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Notes */}
                  {order.specialNotes && (
                    <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs italic text-gray-700 dark:text-gray-300">
                      {order.specialNotes}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {order.kitchenStatus === 'pending' && (
                      <Button
                        className="flex-1"
                        onClick={() => handleStatusChange(order.id, 'preparing')}
                      >
                        Start Preparing
                      </Button>
                    )}
                    {order.kitchenStatus === 'preparing' && (
                      <Button
                        className="flex-1"
                        variant="success"
                        onClick={() => handleStatusChange(order.id, 'ready')}
                      >
                        Mark Ready
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;
