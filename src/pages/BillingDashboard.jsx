import { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { User, CreditCard, Check } from 'lucide-react';
import apiClient from '../services/api';
import OrderService from '../services/order.service';
import BillService from '../services/bill.service';

const BillingDashboard = () => {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const loadData = async () => {
    try {
      setLoading(true);
      const [tablesRes, ordersRes] = await Promise.all([
        apiClient.get('/tables'),
        OrderService.getOrders(),
      ]);

      setTables(tablesRes?.data?.data || []);
      setOrders(ordersRes?.data || []);
    } catch (error) {
      console.error('Failed to load billing data:', error);
      alert('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeOrderByTable = useMemo(() => {
    const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'billing'];
    const map = new Map();

    orders
      .filter((o) => o.tableId && activeStatuses.includes(o.status))
      .forEach((order) => {
        map.set(order.tableId, order);
      });

    return map;
  }, [orders]);

  const selectTableForBilling = async (table) => {
    setSelectedTable(table);
    const order = activeOrderByTable.get(table.id) || null;
    setSelectedOrder(order);

    if (!order) {
      setSelectedBill(null);
      return;
    }

    try {
      const billRes = await BillService.getBillByOrder(order.id);
      setSelectedBill(billRes?.data || null);
    } catch (error) {
      console.error('Failed to fetch bill:', error);
      setSelectedBill(null);
    }
  };

  const handleGenerateBill = async () => {
    if (!selectedOrder) return;

    try {
      setActionLoading(true);
      const billRes = await BillService.generateBill(selectedOrder.id);
      setSelectedBill(billRes?.data || null);
      await loadData();
      alert('Bill generated successfully');
    } catch (error) {
      console.error('Failed to generate bill:', error);
      alert(error?.response?.data?.message || 'Failed to generate bill');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedBill) return;

    try {
      setActionLoading(true);
      await BillService.recordPayment(selectedBill.id, { paymentMethod });
      setShowPaymentModal(false);
      await loadData();

      if (selectedTable) {
        const latestTable = tables.find((t) => t.id === selectedTable.id) || selectedTable;
        await selectTableForBilling(latestTable);
      }

      alert('Payment recorded and table closed successfully');
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert(error?.response?.data?.message || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-500 text-green-700';
      case 'occupied': return 'bg-orange-100 border-orange-500 text-orange-700';
      case 'billing': return 'bg-purple-100 border-purple-500 text-purple-700';
      case 'reserved': return 'bg-blue-100 border-blue-500 text-blue-700';
      default: return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  const currentSubtotal = Number(selectedBill?.subtotal ?? selectedOrder?.subtotal ?? 0);
  const currentTax = Number(selectedBill?.taxAmount ?? selectedOrder?.taxAmount ?? 0);
  const currentDiscount = Number(selectedBill?.discountAmount ?? selectedOrder?.discountAmount ?? 0);
  const currentTotal = Number(selectedBill?.totalAmount ?? selectedOrder?.totalAmount ?? 0);

  const orderItems = selectedOrder?.items || [];

  const billingTables = tables.filter((t) => ['occupied', 'billing'].includes(t.status));

  return (
    <div className="min-h-screen">
      <Header title="Billing Dashboard" />
      
      <div className="p-8">
        {loading ? (
          <Card>
            <div className="py-8 text-center text-gray-500">Loading billing data...</div>
          </Card>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables Section */}
          <div className="lg:col-span-2">
            <Card title="Occupied / Billing Tables" className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {billingTables.map(table => {
                  const tableOrder = activeOrderByTable.get(table.id);
                  const itemCount = tableOrder?.items?.length || 0;

                  return (
                  <button
                    key={table.id}
                    onClick={() => selectTableForBilling(table)}
                    className={`
                      p-6 rounded-lg border-2 transition-all hover:shadow-lg
                      ${getTableStatusColor(table.status)}
                      ${selectedTable?.id === table.id ? 'ring-4 ring-orange-300' : ''}
                    `}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">{table.tableNumber}</div>
                      <div className="text-sm capitalize mb-1">{table.status}</div>
                      <div className="text-xs flex items-center justify-center gap-1">
                        <User size={14} />
                        {table.capacity} seats
                      </div>
                      {itemCount > 0 && (
                        <div className="mt-2 text-xs font-semibold">
                          {itemCount} items
                        </div>
                      )}
                    </div>
                  </button>
                )})}
                {billingTables.length === 0 && (
                  <div className="col-span-full py-8 text-center text-gray-500">
                    No occupied tables pending billing.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card title={selectedTable ? `${selectedTable.tableNumber} Billing` : 'Select a Table'}>
              <div className="space-y-4">
                {selectedTable ? (
                  <>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Table:</span>
                        <span className="font-semibold">{selectedTable.tableNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-semibold capitalize">{selectedTable.status}</span>
                      </div>
                      {selectedOrder && (
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-gray-600">Order No:</span>
                          <span className="font-semibold">{selectedOrder.orderNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {orderItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          No active order found for this table
                        </div>
                      ) : (
                        orderItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-200">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.menuItem?.name || 'Item'}</div>
                              <div className="text-xs text-gray-500">
                                ₹{Number(item.unitPrice).toFixed(2)} × {item.quantity}
                              </div>
                            </div>
                            <div className="font-semibold text-sm">₹{Number(item.subtotal).toFixed(2)}</div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t-2 border-gray-300 pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>₹{currentSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax:</span>
                          <span>₹{currentTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Discount:</span>
                          <span>₹{currentDiscount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-orange-600">₹{currentTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleGenerateBill}
                        disabled={!selectedOrder || actionLoading}
                      >
                        {selectedBill ? 'Regenerate Bill' : 'Generate Bill'}
                      </Button>
                      <Button
                        variant="success"
                        className="w-full"
                        icon={<CreditCard size={18} />}
                        onClick={() => setShowPaymentModal(true)}
                        disabled={!selectedBill || actionLoading || selectedBill.paymentStatus === 'paid'}
                      >
                        {selectedBill?.paymentStatus === 'paid' ? 'Already Paid' : 'Process Payment & Close Table'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <User size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Select a table to start billing</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Process Payment"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Amount to Pay:</span>
              <span className="text-2xl font-bold text-orange-600">
                ₹{currentTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPaymentMethod('cash')} className={`p-4 border-2 rounded-lg transition-colors ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                <CreditCard className="mx-auto mb-2" size={24} />
                <div className="text-sm font-medium">Cash</div>
              </button>
              <button onClick={() => setPaymentMethod('card')} className={`p-4 border-2 rounded-lg transition-colors ${paymentMethod === 'card' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                <CreditCard className="mx-auto mb-2" size={24} />
                <div className="text-sm font-medium">Card</div>
              </button>
              <button onClick={() => setPaymentMethod('upi')} className={`p-4 border-2 rounded-lg transition-colors ${paymentMethod === 'upi' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                <CreditCard className="mx-auto mb-2" size={24} />
                <div className="text-sm font-medium">UPI</div>
              </button>
              <button onClick={() => setPaymentMethod('other')} className={`p-4 border-2 rounded-lg transition-colors ${paymentMethod === 'other' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                <CreditCard className="mx-auto mb-2" size={24} />
                <div className="text-sm font-medium">Other</div>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button variant="success" className="flex-1" icon={<Check size={18} />} onClick={handleRecordPayment} disabled={actionLoading || !selectedBill}>
              Confirm Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BillingDashboard;
