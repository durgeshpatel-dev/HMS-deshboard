import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Eye, Check, X, Clock, Phone, MapPin, Package } from 'lucide-react';

const ParcelOrders = () => {
  const [orders, setOrders] = useState([
    {
      id: 'PO001',
      customerName: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      address: '123 MG Road, Bangalore',
      items: [
        { name: 'Paneer Tikka', quantity: 2, price: 280 },
        { name: 'Butter Naan', quantity: 4, price: 40 }
      ],
      total: 720,
      status: 'pending',
      orderTime: '2:30 PM',
      date: '2 March 2026'
    },
    {
      id: 'PO002',
      customerName: 'Priya Sharma',
      phone: '+91 98765 43211',
      address: '456 Brigade Road, Bangalore',
      items: [
        { name: 'Chicken Biryani', quantity: 1, price: 320 },
        { name: 'Gulab Jamun', quantity: 2, price: 80 }
      ],
      total: 480,
      status: 'preparing',
      orderTime: '2:45 PM',
      date: '2 March 2026'
    },
    {
      id: 'PO003',
      customerName: 'Amit Patel',
      phone: '+91 98765 43212',
      address: '789 Indiranagar, Bangalore',
      items: [
        { name: 'Dal Makhani', quantity: 2, price: 240 },
        { name: 'Veg Manchurian', quantity: 1, price: 200 }
      ],
      total: 680,
      status: 'ready',
      orderTime: '1:15 PM',
      date: '2 March 2026'
    },
    {
      id: 'PO004',
      customerName: 'Sneha Reddy',
      phone: '+91 98765 43213',
      address: '321 Koramangala, Bangalore',
      items: [
        { name: 'Masala Dosa', quantity: 3, price: 150 }
      ],
      total: 450,
      status: 'delivered',
      orderTime: '12:00 PM',
      date: '2 March 2026'
    },
  ]);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-700', icon: Package },
    ready: { label: 'Ready', color: 'bg-green-100 text-green-700', icon: Check },
    delivered: { label: 'Delivered', color: 'bg-gray-100 text-gray-700', icon: Check },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: X }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(order => order.status === statusFilter);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  return (
    <div className="min-h-screen">
      <Header title="Parcel Orders" />
      
      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setStatusFilter('all')}>
            <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Orders</div>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setStatusFilter('pending')}>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setStatusFilter('preparing')}>
            <div className="text-3xl font-bold text-blue-600">{stats.preparing}</div>
            <div className="text-sm text-gray-500">Preparing</div>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setStatusFilter('ready')}>
            <div className="text-3xl font-bold text-green-600">{stats.ready}</div>
            <div className="text-sm text-gray-500">Ready</div>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setStatusFilter('delivered')}>
            <div className="text-3xl font-bold text-gray-600">{stats.delivered}</div>
            <div className="text-sm text-gray-500">Delivered</div>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {statusFilter === 'all' ? 'All Orders' : `${statusConfig[statusFilter].label} Orders`}
            </h3>
            <p className="text-sm text-gray-500">{filteredOrders.length} orders found</p>
          </div>
          
          <Link to="/create-parcel-order">
            <Button variant="primary" icon={<Plus size={18} />}>
              New Parcel Order
            </Button>
          </Link>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const StatusIcon = statusConfig[order.status].icon;
            return (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-gray-800">{order.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusConfig[order.status].color}`}>
                            <StatusIcon size={14} />
                            {statusConfig[order.status].label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{order.orderTime} • {order.date}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Phone size={16} className="text-orange-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{order.customerName}</div>
                          <div className="text-gray-500">{order.phone}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MapPin size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-gray-600">{order.address}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Package size={16} className="text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{order.items.length} items</div>
                          <div className="text-gray-500">₹{order.total}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Eye size={16} />}
                      onClick={() => handleViewDetails(order)}
                      className="flex-1 md:flex-initial"
                    >
                      View
                    </Button>
                    
                    {order.status === 'pending' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="flex-1 md:flex-initial"
                      >
                        Accept
                      </Button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="flex-1 md:flex-initial"
                      >
                        Mark Ready
                      </Button>
                    )}
                    
                    {order.status === 'ready' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="flex-1 md:flex-initial"
                      >
                        Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Found</h3>
            <p className="text-gray-500 mb-6">There are no {statusFilter} orders at the moment</p>
            <Link to="/create-parcel-order">
              <Button variant="primary" icon={<Plus size={18} />}>
                Create New Order
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Order Details - ${selectedOrder?.id}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between pb-4 border-b">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusConfig[selectedOrder.status].color}`}>
                {statusConfig[selectedOrder.status].label}
              </span>
              <div className="text-right">
                <div className="text-sm text-gray-500">Order Time</div>
                <div className="font-semibold">{selectedOrder.orderTime}</div>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Customer Information</h4>
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-semibold">{selectedOrder.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-semibold text-right">{selectedOrder.address}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">₹{item.price} × {item.quantity}</div>
                    </div>
                    <div className="font-semibold">₹{item.price * item.quantity}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-orange-600">₹{selectedOrder.total}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {selectedOrder.status === 'pending' && (
                <>
                  <Button
                    variant="success"
                    className="flex-1"
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'preparing');
                      setShowDetailsModal(false);
                    }}
                  >
                    Accept Order
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'cancelled');
                      setShowDetailsModal(false);
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
              
              {selectedOrder.status === 'preparing' && (
                <Button
                  variant="success"
                  className="flex-1"
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, 'ready');
                    setShowDetailsModal(false);
                  }}
                >
                  Mark as Ready
                </Button>
              )}
              
              {selectedOrder.status === 'ready' && (
                <Button
                  variant="success"
                  className="flex-1"
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, 'delivered');
                    setShowDetailsModal(false);
                  }}
                >
                  Mark as Delivered
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParcelOrders;
