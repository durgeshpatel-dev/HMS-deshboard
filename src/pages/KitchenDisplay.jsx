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
      await OrderService.updateOrder(orderId, { kitchenStatus: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-red-100 border-red-300',
      preparing: 'bg-yellow-100 border-yellow-300',
      ready: 'bg-green-100 border-green-300',
    };
    return colors[status] || 'bg-gray-100 border-gray-300';
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
          <Card className="bg-red-900 border-red-700">
            <div className="p-4">
              <div className="text-3xl font-bold">{pendingCount}</div>
              <div className="text-red-200 text-sm">Pending Orders</div>
            </div>
          </Card>
          <Card className="bg-yellow-900 border-yellow-700">
            <div className="p-4">
              <div className="text-3xl font-bold">
                {orders.filter((o) => o.kitchenStatus === 'preparing').length}
              </div>
              <div className="text-yellow-200 text-sm">Preparing</div>
            </div>
          </Card>
          <Card className="bg-green-900 border-green-700">
            <div className="p-4">
              <div className="text-3xl font-bold">{readyCount}</div>
              <div className="text-green-200 text-sm">Ready for Pickup</div>
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
                      <span className="font-bold text-lg">{order.orderNumber}</span>
                    </div>
                    <span className="text-xs font-semibold uppercase">
                      {order.kitchenStatus || 'pending'}
                    </span>
                  </div>

                  {/* Order Type & Time */}
                  <div className="mb-3 pb-3 border-b border-current border-opacity-20">
                    <div className="text-sm font-semibold">
                      {order.orderType === 'dine_in' 
                        ? `Table ${order.table?.tableNumber || 'N/A'}`
                        : 'Parcel Order'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {getElapsedTime(order.createdAt)}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold mb-2 opacity-75">ITEMS:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {order.items?.map((item) => (
                        <div key={item.id} className="text-sm">
                          <span className="font-semibold">{item.quantity}x</span>{' '}
                          {item.menuItem?.name || 'Item'}
                          {item.customizations?.specialInstructions && (
                            <div className="text-xs mt-1 italic opacity-75">
                              Note: {item.customizations.specialInstructions}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Notes */}
                  {order.specialNotes && (
                    <div className="mb-4 p-2 bg-black bg-opacity-20 rounded text-xs italic">
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
