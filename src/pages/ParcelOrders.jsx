import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Eye, Check, X, Clock, Phone, MapPin, Package, Printer } from 'lucide-react';
import OrderService from '../services/order.service';
import BillService from '../services/bill.service';
import SettingsService from '../services/settings.service';
import PrintableBill from '../components/PrintableBill';
import { useSocket } from '../hooks/useSocket';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-indigo-100 text-indigo-700', icon: Check },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-700', icon: Package },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700', icon: Check },
  billing: { label: 'Billing', color: 'bg-purple-100 text-purple-700', icon: Clock },
  completed: { label: 'Delivered', color: 'bg-gray-100 text-gray-700', icon: Check },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: X },
};

const ParcelOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [discountPercentage, setDiscountPercentage] = useState('0');
  const [extraCharges, setExtraCharges] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [restaurantInfo, setRestaurantInfo] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [orderResponse, settingsResponse] = await Promise.all([
        OrderService.getOrders(),
        SettingsService.getRestaurantSettings(),
      ]);
      const allOrders = orderResponse?.data || [];
      const parcelOrders = allOrders.filter((order) => order.orderType === 'parcel');
      setOrders(parcelOrders);
      setRestaurantInfo(settingsResponse?.data || null);
    } catch (error) {
      console.error('Failed to fetch parcel orders:', error);
      alert('Failed to fetch parcel orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  useSocket('order:created', () => {
    void fetchOrders();
  });

  useSocket('order:updated', () => {
    void fetchOrders();
  });

  useSocket('bill:updated', () => {
    void fetchOrders();
    if (selectedOrder?.id) {
      void fetchBill(selectedOrder.id);
    }
  });

  const fetchBill = async (orderId) => {
    try {
      const billResponse = await BillService.getBillByOrder(orderId);
      const bill = billResponse?.data || null;
      setSelectedBill(bill);
      const total = Number(bill?.totalAmount || 0);
      setPaymentAmount(total > 0 ? total.toFixed(2) : '');
      return bill;
    } catch {
      setSelectedBill(null);
      return null;
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    setDiscountPercentage('0');
    setExtraCharges('0');
    setPaymentMethod('cash');
    await fetchBill(order.id);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(true);
      await OrderService.updateOrder(orderId, { status: newStatus });
      await fetchOrders();

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert(error?.response?.data?.message || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateBill = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const discount = Number(discountPercentage || 0);
      const extra = Number(extraCharges || 0);
      const payload = {};
      if (Number.isFinite(discount) && discount > 0) payload.discountPercentage = discount;
      if (Number.isFinite(extra) && extra > 0) payload.extraCharges = extra;
      await BillService.generateBill(selectedOrder.id, payload);
      await fetchOrders();
      await fetchBill(selectedOrder.id);
      setSelectedOrder((prev) => (prev ? { ...prev, status: 'billing' } : prev));
      alert('Bill generated successfully');
    } catch (error) {
      console.error('Failed to generate parcel bill:', error);
      alert(error?.response?.data?.message || 'Failed to generate bill');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedBill) return;
    try {
      setActionLoading(true);
      const parsedAmount = Number(paymentAmount || selectedBill.totalAmount || 0);
      await BillService.recordPayment(selectedBill.id, {
        paymentMethod,
        amount: parsedAmount,
      });
      await fetchOrders();
      if (selectedOrder?.id) {
        await fetchBill(selectedOrder.id);
      }
      setSelectedOrder((prev) => (prev ? { ...prev, status: 'completed' } : prev));
      alert('Payment recorded successfully');
    } catch (error) {
      console.error('Failed to record parcel payment:', error);
      alert(error?.response?.data?.message || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      delivered: orders.filter((o) => o.status === 'completed').length,
    };
  }, [orders]);

  return (
    <div className="min-h-screen">
      <Header title="Parcel Orders" />

      <div className="p-8 no-print">
        {loading ? (
          <Card>
            <div className="text-center py-10 text-gray-500">Loading parcel orders...</div>
          </Card>
        ) : (
          <>
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
              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setStatusFilter('completed')}>
                <div className="text-3xl font-bold text-gray-600">{stats.delivered}</div>
                <div className="text-sm text-gray-500">Delivered</div>
              </Card>
            </div>

            <div className="mb-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {statusFilter === 'all' ? 'All Orders' : `${statusConfig[statusFilter]?.label || statusFilter} Orders`}
                </h3>
                <p className="text-sm text-gray-500">{filteredOrders.length} orders found</p>
              </div>

              <Link to="/create-parcel-order">
                <Button variant="primary" icon={<Plus size={18} />}>
                  New Parcel Order
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusKey = statusConfig[order.status] ? order.status : 'pending';
                const StatusIcon = statusConfig[statusKey].icon;
                const itemCount = order.items?.length || 0;
                const customerAddress = order.specialNotes || '-';

                return (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-bold text-gray-800">{order.orderNumber}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusConfig[statusKey].color}`}>
                                <StatusIcon size={14} />
                                {statusConfig[statusKey].label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Phone size={16} className="text-orange-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{order.customerName || 'Walk-in'}</div>
                              <div className="text-gray-500">{order.customerPhone || '-'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <MapPin size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <div className="text-gray-600 truncate max-w-[220px]" title={customerAddress}>{customerAddress}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Package size={16} className="text-green-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{itemCount} items</div>
                              <div className="text-gray-500">₹{Number(order.totalAmount).toFixed(2)}</div>
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
                            disabled={actionLoading}
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
                            disabled={actionLoading}
                          >
                            Mark Ready
                          </Button>
                        )}

                        {order.status === 'ready' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                            className="flex-1 md:flex-initial"
                            disabled={actionLoading}
                          >
                            Billing
                          </Button>
                        )}

                        {order.status === 'billing' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                            className="flex-1 md:flex-initial"
                            disabled={actionLoading}
                          >
                            Collect Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

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
          </>
        )}
      </div>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Order Details - ${selectedOrder?.orderNumber || ''}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusConfig[selectedOrder.status]?.color || statusConfig.pending.color}`}>
                {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
              </span>
              <div className="text-right">
                <div className="text-sm text-gray-500">Order Time</div>
                <div className="font-semibold">{new Date(selectedOrder.createdAt).toLocaleString()}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Customer Information</h4>
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold">{selectedOrder.customerName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-semibold">{selectedOrder.customerPhone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address/Note:</span>
                  <span className="font-semibold text-right">{selectedOrder.specialNotes || '-'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{item.menuItem?.name || 'Item'}</div>
                      <div className="text-sm text-gray-500">₹{Number(item.unitPrice).toFixed(2)} × {item.quantity}</div>
                    </div>
                    <div className="font-semibold">₹{Number(item.subtotal).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-orange-600">₹{Number(selectedOrder.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-gray-800">Billing</h4>

              {selectedBill ? (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bill No:</span>
                    <span className="font-semibold">{selectedBill.billNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">₹{Number(selectedBill.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-semibold">₹{Number(selectedBill.taxAmount || 0).toFixed(2)}</span>
                  </div>
                  {Number(selectedBill.discountAmount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount{Number(selectedBill.discountPercentage || 0) > 0 ? ` (${Number(selectedBill.discountPercentage).toFixed(1)}%)` : ''}:</span>
                      <span className="font-semibold text-green-600">-₹{Number(selectedBill.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(selectedBill.extraCharges || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Packaging Charges:</span>
                      <span className="font-semibold">₹{Number(selectedBill.extraCharges).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base border-t pt-2">
                    <span className="text-gray-700 font-semibold">Total:</span>
                    <span className="font-bold text-orange-600">₹{Number(selectedBill.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className="font-semibold capitalize">{selectedBill.paymentStatus || 'unpaid'}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Packaging Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={extraCharges}
                      onChange={(e) => setExtraCharges(e.target.value)}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              {selectedBill && selectedBill.paymentStatus !== 'paid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="input-field"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex gap-3">
              {selectedOrder.status === 'pending' && (
                <>
                  <Button
                    variant="success"
                    className="flex-1"
                    disabled={actionLoading}
                    onClick={() => {
                      void updateOrderStatus(selectedOrder.id, 'preparing');
                      setShowDetailsModal(false);
                    }}
                  >
                    Accept Order
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    disabled={actionLoading}
                    onClick={() => {
                      void updateOrderStatus(selectedOrder.id, 'cancelled');
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
                  disabled={actionLoading}
                  onClick={() => {
                    void updateOrderStatus(selectedOrder.id, 'ready');
                    setShowDetailsModal(false);
                  }}
                >
                  Mark as Ready
                </Button>
              )}

              {selectedOrder.status === 'ready' && (
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={actionLoading}
                  onClick={() => {
                    void handleGenerateBill();
                  }}
                >
                  Generate Bill
                </Button>
              )}

              {selectedOrder.status === 'billing' && selectedBill && selectedBill.paymentStatus !== 'paid' && (
                <Button
                  variant="success"
                  className="flex-1"
                  disabled={actionLoading}
                  onClick={() => {
                    void handleRecordPayment();
                  }}
                >
                  Record Payment
                </Button>
              )}

              {selectedBill && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  icon={<Printer size={16} />}
                  onClick={() => window.print()}
                >
                  Print Bill
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden Printable Bill */}
      {selectedBill && selectedOrder && (
        <PrintableBill
          bill={selectedBill}
          table={null}
          orders={[selectedOrder]}
          restaurantInfo={restaurantInfo}
        />
      )}
    </div>
  );
};

export default ParcelOrders;
