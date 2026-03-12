import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import PrintableBill from '../components/PrintableBill';
import { Plus, Minus, Eye, Check, X, Clock, Phone, MapPin, Package, Pencil, Printer, StickyNote, Trash2 } from 'lucide-react';
import OrderService from '../services/order.service';
import BillService from '../services/bill.service';
import MenuService from '../services/menu.service';
import SettingsService from '../services/settings.service';
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

const CAN_ADD_ITEMS_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];
const CAN_EDIT_STATUSES = ['pending'];

const ParcelOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [discountPercentage, setDiscountPercentage] = useState('0');
  const [extraChargesAmount, setExtraChargesAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');

  // Add Items modal
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [addCategory, setAddCategory] = useState('All');
  const [addCart, setAddCart] = useState({}); // { [menuItemId]: { qty, note } }
  const [showAddNoteFor, setShowAddNoteFor] = useState(null);

  // Edit Order modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

  // Load restaurant info for printing
  useEffect(() => {
    SettingsService.getRestaurantSettings()
      .then((res) => setRestaurantInfo(res?.data || null))
      .catch(() => {});
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await OrderService.getOrders();
      const allOrders = response?.data || [];
      setOrders(allOrders.filter((o) => o.orderType === 'parcel'));
    } catch (error) {
      console.error('Failed to fetch parcel orders:', error);
      alert('Failed to fetch parcel orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  useSocket('order:created', () => { void fetchOrders(); });
  useSocket('order:updated', useCallback(() => {
    void fetchOrders();
  }, [fetchOrders]));
  useSocket('bill:updated', useCallback(() => {
    void fetchOrders();
    if (selectedOrder?.id) void fetchBill(selectedOrder.id);
  }, [fetchOrders, selectedOrder]));

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
    setExtraChargesAmount('0');
    setPaymentMethod('cash');
    await fetchBill(order.id);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(true);
      await OrderService.updateOrder(orderId, { status: newStatus });
      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
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
      const extra = Number(extraChargesAmount || 0);

      if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
        alert('Discount must be between 0% and 100%');
        setActionLoading(false);
        return;
      }

      if (!Number.isFinite(extra) || extra < 0) {
        alert('Packaging charges must be 0 or more');
        setActionLoading(false);
        return;
      }

      const payload = {};
      if (Number.isFinite(discount) && discount > 0) {
        const baseSubtotal = Number(selectedOrder?.subtotal || 0);
        const computedDiscountAmount = (baseSubtotal * discount) / 100;
        payload.discountPercentage = discount;
        payload.discountAmount = Number.isFinite(computedDiscountAmount) ? computedDiscountAmount : 0;
      }
      if (Number.isFinite(extra) && extra > 0) payload.extraCharges = extra;
      try {
        await BillService.generateBill(selectedOrder.id, payload);
      } catch (firstError) {
        const details = firstError?.response?.data?.errors;
        const message = firstError?.response?.data?.message || '';
        const detailText = Array.isArray(details)
          ? details.map((d) => `${d?.path || ''} ${d?.message || ''}`.trim()).join(' | ')
          : '';

        const needsLegacyRetry =
          firstError?.response?.status === 400 &&
          /(discountPercentage|extraCharges|Validation failed|Unknown argument)/i.test(`${message} ${detailText}`);

        if (!needsLegacyRetry) {
          throw firstError;
        }

        const legacyPayload = {};
        const baseSubtotal = Number(selectedOrder?.subtotal || 0);
        const legacyDiscountAmount = Number.isFinite(baseSubtotal)
          ? (baseSubtotal * Math.max(0, Math.min(100, discount))) / 100
          : 0;
        if (legacyDiscountAmount > 0) {
          legacyPayload.discountAmount = legacyDiscountAmount;
        }

        await BillService.generateBill(selectedOrder.id, legacyPayload);
      }
      await fetchOrders();
      await fetchBill(selectedOrder.id);
      setSelectedOrder((prev) => prev ? { ...prev, status: 'billing' } : prev);
      alert('Bill generated successfully');
    } catch (error) {
      console.error('Failed to generate parcel bill:', error);
      const details = error?.response?.data?.errors;
      const firstDetail = Array.isArray(details) && details.length > 0
        ? details[0]?.message
        : null;
      alert(firstDetail || error?.response?.data?.message || 'Failed to generate bill');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedBill) return;
    try {
      setActionLoading(true);
      const parsedAmount = Number(paymentAmount || selectedBill.totalAmount || 0);
      await BillService.recordPayment(selectedBill.id, { paymentMethod, amount: parsedAmount });
      await fetchOrders();
      if (selectedOrder?.id) await fetchBill(selectedOrder.id);
      setSelectedOrder((prev) => prev ? { ...prev, status: 'completed' } : prev);
      alert('Payment recorded successfully');
    } catch (error) {
      console.error('Failed to record parcel payment:', error);
      alert(error?.response?.data?.message || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    if (!selectedBill) {
      alert('Please generate a bill first');
      return;
    }
    window.print();
  };

  // ─── Add Items Modal ───────────────────────────────────────────────────────

  const fetchMenuForAdd = async () => {
    if (menuItems.length > 0) return;
    try {
      setLoadingMenu(true);
      const res = await MenuService.getItems();
      setMenuItems(res?.data || []);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoadingMenu(false);
    }
  };

  const openAddItemsModal = async () => {
    setAddCart({});
    setAddCategory('All');
    setShowAddNoteFor(null);
    setShowAddItemsModal(true);
    await fetchMenuForAdd();
  };

  const addCategories = useMemo(() => {
    const names = menuItems.map((i) => i.category?.name).filter(Boolean);
    return ['All', ...Array.from(new Set(names))];
  }, [menuItems]);

  const filteredAddMenu = useMemo(() => {
    const avail = menuItems.filter((i) => i.isAvailable !== false);
    if (addCategory === 'All') return avail;
    return avail.filter((i) => i.category?.name === addCategory);
  }, [menuItems, addCategory]);

  const addCartQty = (itemId, delta) => {
    setAddCart((prev) => {
      const existing = prev[itemId] || { qty: 0, note: '' };
      const newQty = Math.max(0, existing.qty + delta);
      if (newQty === 0) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
      return { ...prev, [itemId]: { ...existing, qty: newQty } };
    });
  };

  const submitAddItems = async () => {
    if (!selectedOrder) return;
    const items = Object.entries(addCart)
      .filter(([, v]) => v.qty > 0)
      .map(([menuItemId, v]) => ({
        menuItemId: Number(menuItemId),
        quantity: v.qty,
        ...(v.note?.trim() ? { customizations: { note: v.note.trim() } } : {}),
      }));
    if (items.length === 0) { alert('Please select at least one item'); return; }
    try {
      setActionLoading(true);
      await OrderService.addItems(selectedOrder.id, { items });
      // Refresh full order from backend
      const updatedRes = await OrderService.getOrderById(selectedOrder.id);
      const updatedOrder = updatedRes?.data || selectedOrder;
      setSelectedOrder(updatedOrder);
      await fetchOrders();
      setShowAddItemsModal(false);
      alert('Items added successfully');
    } catch (error) {
      console.error('Failed to add items:', error);
      alert(error?.response?.data?.message || 'Failed to add items');
    } finally {
      setActionLoading(false);
    }
  };

  const addCartTotal = useMemo(() => {
    return Object.entries(addCart).reduce((sum, [id, v]) => {
      const item = menuItems.find((m) => m.id === Number(id));
      return sum + (item ? Number(item.price) * v.qty : 0);
    }, 0);
  }, [addCart, menuItems]);

  // ─── Edit Order Modal ──────────────────────────────────────────────────────

  const openEditModal = () => {
    if (!selectedOrder) return;
    setEditItems(
      (selectedOrder.items || []).map((item) => ({
        ...item,
        editQty: item.quantity,
        note: item.customizations?.note || '',
        showNote: false,
        toDelete: false,
      }))
    );
    setShowEditModal(true);
  };

  const updateEditQty = (itemId, delta) => {
    setEditItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, editQty: Math.max(1, it.editQty + delta) } : it
      )
    );
  };

  const markEditDelete = (itemId) => {
    setEditItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, toDelete: !it.toDelete } : it))
    );
  };

  const submitEditOrder = async () => {
    if (!selectedOrder) return;
    setEditLoading(true);
    try {
      for (const item of editItems) {
        if (item.toDelete) {
          await OrderService.deleteItem(selectedOrder.id, item.id);
        } else {
          const qtyChanged = item.editQty !== item.quantity;
          const noteChanged = item.note.trim() !== (item.customizations?.note || '');
          if (qtyChanged || noteChanged) {
            const body = { quantity: item.editQty };
            if (item.note?.trim()) body.customizations = { note: item.note.trim() };
            await OrderService.updateItem(selectedOrder.id, item.id, body);
          }
        }
      }
      const updatedRes = await OrderService.getOrderById(selectedOrder.id);
      const updatedOrder = updatedRes?.data || selectedOrder;
      setSelectedOrder(updatedOrder);
      await fetchOrders();
      setShowEditModal(false);
      alert('Order updated successfully');
    } catch (error) {
      console.error('Failed to edit order:', error);
      alert(error?.response?.data?.message || 'Failed to update order');
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Stats + Filter ────────────────────────────────────────────────────────

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    delivered: orders.filter((o) => o.status === 'completed').length,
  }), [orders]);

  const canAddItems = selectedOrder && CAN_ADD_ITEMS_STATUSES.includes(selectedOrder.status) && !selectedBill;
  const canEdit = selectedOrder && CAN_EDIT_STATUSES.includes(selectedOrder.status) && !selectedBill;

  // ─── Parcel "table" data for PrintableBill ─────────────────────────────────
  const parcelTableInfo = selectedOrder
    ? { tableNumber: `Parcel${selectedOrder.customerName ? ` – ${selectedOrder.customerName}` : ''}` }
    : null;
  const parcelOrders = selectedOrder ? [selectedOrder] : [];

  return (
    <div className="min-h-screen">
      <Header title="Parcel Orders" />

      <div className="p-8">
        {loading ? (
          <Card>
            <div className="text-center py-10 text-gray-500">Loading parcel orders...</div>
          </Card>
        ) : (
          <>
            {/* Stats */}
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

            {/* Header + New Button */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {statusFilter === 'all' ? 'All Orders' : `${statusConfig[statusFilter]?.label || statusFilter} Orders`}
                </h3>
                <p className="text-sm text-gray-500">{filteredOrders.length} orders found</p>
              </div>
              <Link to="/create-parcel-order">
                <Button variant="primary" icon={<Plus size={18} />}>New Parcel Order</Button>
              </Link>
            </div>

            {/* Orders List */}
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
                            <div className="p-2 bg-orange-100 rounded-lg"><Phone size={16} className="text-orange-600" /></div>
                            <div>
                              <div className="font-semibold text-gray-800">{order.customerName || 'Walk-in'}</div>
                              <div className="text-gray-500">{order.customerPhone || '-'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg"><MapPin size={16} className="text-blue-600" /></div>
                            <div className="text-gray-600 truncate max-w-[220px]" title={customerAddress}>{customerAddress}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 rounded-lg"><Package size={16} className="text-green-600" /></div>
                            <div>
                              <div className="font-semibold text-gray-800">{itemCount} items</div>
                              <div className="text-gray-500">₹{Number(order.totalAmount).toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2">
                        <Button variant="outline" size="sm" icon={<Eye size={16} />} onClick={() => handleViewDetails(order)} className="flex-1 md:flex-initial">
                          View
                        </Button>
                        {order.status === 'pending' && (
                          <Button variant="primary" size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')} className="flex-1 md:flex-initial" disabled={actionLoading}>
                            Accept
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button variant="success" size="sm" onClick={() => updateOrderStatus(order.id, 'ready')} className="flex-1 md:flex-initial" disabled={actionLoading}>
                            Mark Ready
                          </Button>
                        )}
                        {(order.status === 'ready' || order.status === 'billing') && (
                          <Button variant="primary" size="sm" onClick={() => handleViewDetails(order)} className="flex-1 md:flex-initial" disabled={actionLoading}>
                            {order.status === 'billing' ? 'Collect Payment' : 'Billing'}
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
                  <Button variant="primary" icon={<Plus size={18} />}>Create New Order</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Order Details Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Order Details – ${selectedOrder?.orderNumber || ''}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status + time */}
            <div className="flex items-center justify-between pb-4 border-b">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusConfig[selectedOrder.status]?.color || statusConfig.pending.color}`}>
                {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
              </span>
              <div className="text-right">
                <div className="text-sm text-gray-500">Order Time</div>
                <div className="font-semibold">{new Date(selectedOrder.createdAt).toLocaleString()}</div>
              </div>
            </div>

            {/* Customer Info */}
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
                  <span className="font-semibold text-right max-w-xs">{selectedOrder.specialNotes || '-'}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">Order Items</h4>
                <div className="flex gap-2">
                  {canEdit && (
                    <Button variant="outline" size="sm" icon={<Pencil size={14} />} onClick={openEditModal}>
                      Edit Order
                    </Button>
                  )}
                  {canAddItems && (
                    <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAddItemsModal}>
                      Add Items
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item) => (
                  <div key={item.id} className="py-3 px-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{item.menuItem?.name || 'Item'}</div>
                        <div className="text-sm text-gray-500">₹{Number(item.unitPrice).toFixed(2)} × {item.quantity}</div>
                        {item.customizations?.note && (
                          <div className="text-xs text-orange-600 mt-1 italic">📝 {item.customizations.note}</div>
                        )}
                      </div>
                      <div className="font-semibold">₹{Number(item.subtotal).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Order Total:</span>
                <span className="text-orange-600">₹{Number(selectedOrder.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            {/* Billing Section */}
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
                      <span className="text-gray-600">
                        Discount{Number(selectedBill.discountPercentage || 0) > 0 ? ` (${Number(selectedBill.discountPercentage).toFixed(2)}%)` : ''}:
                      </span>
                      <span className="font-semibold text-green-600">-₹{Number(selectedBill.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(selectedBill.extraCharges || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Packaging Charges:</span>
                      <span className="font-semibold text-orange-600">+₹{Number(selectedBill.extraCharges).toFixed(2)}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                      className="input-field"
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Packaging Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={extraChargesAmount}
                      onChange={(e) => setExtraChargesAmount(e.target.value)}
                      className="input-field"
                      placeholder="e.g. 20"
                    />
                  </div>
                </div>
              )}

              {selectedBill && selectedBill.paymentStatus !== 'paid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field">
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
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {selectedOrder.status === 'pending' && (
                <>
                  <Button variant="success" className="flex-1" disabled={actionLoading}
                    onClick={() => { void updateOrderStatus(selectedOrder.id, 'preparing'); setShowDetailsModal(false); }}>
                    Accept Order
                  </Button>
                  <Button variant="danger" className="flex-1" disabled={actionLoading}
                    onClick={() => { void updateOrderStatus(selectedOrder.id, 'cancelled'); setShowDetailsModal(false); }}>
                    Reject
                  </Button>
                </>
              )}
              {selectedOrder.status === 'preparing' && (
                <Button variant="success" className="flex-1" disabled={actionLoading}
                  onClick={() => { void updateOrderStatus(selectedOrder.id, 'ready'); setShowDetailsModal(false); }}>
                  Mark as Ready
                </Button>
              )}
              {selectedOrder.status === 'ready' && !selectedBill && (
                <Button variant="primary" className="flex-1" disabled={actionLoading} onClick={() => { void handleGenerateBill(); }}>
                  Generate Bill
                </Button>
              )}
              {selectedBill && (
                <>
                  <Button variant="secondary" className="flex-1 no-print" icon={<Printer size={16} />} onClick={handlePrint}>
                    Print Bill
                  </Button>
                  {selectedBill.paymentStatus !== 'paid' && (
                    <Button variant="success" className="flex-1" disabled={actionLoading} onClick={() => { void handleRecordPayment(); }}>
                      Record Payment
                    </Button>
                  )}
                </>
              )}
              {selectedOrder.status === 'billing' && !selectedBill && (
                <Button variant="primary" className="flex-1" disabled={actionLoading} onClick={() => { void handleGenerateBill(); }}>
                  Generate Bill
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Add Items Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showAddItemsModal}
        onClose={() => setShowAddItemsModal(false)}
        title="Add More Items"
        size="lg"
      >
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {addCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setAddCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm transition-colors ${
                  addCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loadingMenu ? (
            <div className="text-center py-8 text-gray-500">Loading menu...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {filteredAddMenu.map((item) => {
                const cartEntry = addCart[item.id];
                const qty = cartEntry?.qty || 0;
                return (
                  <div key={item.id} className={`p-3 border rounded-lg transition-colors ${qty > 0 ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-sm text-gray-800">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.category?.name}</div>
                      </div>
                      <div className="text-orange-600 font-bold text-sm">₹{Number(item.price).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => addCartQty(item.id, -1)} className="p-1 hover:bg-gray-200 rounded" disabled={qty === 0}>
                        <Minus size={14} />
                      </button>
                      <span className="font-semibold w-6 text-center text-sm">{qty}</span>
                      <button type="button" onClick={() => addCartQty(item.id, 1)} className="p-1 hover:bg-gray-200 rounded">
                        <Plus size={14} />
                      </button>
                      {qty > 0 && (
                        <button
                          type="button"
                          title="Add note"
                          onClick={() => setShowAddNoteFor(showAddNoteFor === item.id ? null : item.id)}
                          className={`p-1 rounded ml-auto ${cartEntry?.note?.trim() ? 'text-orange-500' : 'text-gray-400 hover:bg-gray-200'}`}
                        >
                          <StickyNote size={14} />
                        </button>
                      )}
                    </div>
                    {qty > 0 && showAddNoteFor === item.id && (
                      <input
                        type="text"
                        value={cartEntry?.note || ''}
                        onChange={(e) => setAddCart((prev) => ({ ...prev, [item.id]: { ...prev[item.id], note: e.target.value } }))}
                        className="mt-2 w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-orange-400"
                        placeholder="Item note (e.g. extra spicy)..."
                      />
                    )}
                    {qty > 0 && cartEntry?.note?.trim() && showAddNoteFor !== item.id && (
                      <div className="mt-1 text-xs text-orange-600 italic">📝 {cartEntry.note}</div>
                    )}
                  </div>
                );
              })}
              {filteredAddMenu.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-400">No items in this category</div>
              )}
            </div>
          )}

          {/* Summary + submit */}
          {Object.keys(addCart).length > 0 && (
            <div className="border-t pt-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {Object.values(addCart).reduce((s, v) => s + v.qty, 0)} item(s) •{' '}
                <span className="font-semibold text-orange-600">+₹{addCartTotal.toFixed(2)}</span>
              </div>
              <Button variant="success" onClick={submitAddItems} disabled={actionLoading}>
                {actionLoading ? 'Adding...' : 'Add to Order'}
              </Button>
            </div>
          )}
          {Object.keys(addCart).length === 0 && !loadingMenu && (
            <p className="text-center text-sm text-gray-400">Select items above to add them to the order</p>
          )}
        </div>
      </Modal>

      {/* ─── Edit Order Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Order Items"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Adjust quantities or remove items. Changes are saved when you click Save.</p>
          {editItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 border rounded-lg transition-colors ${item.toDelete ? 'border-red-300 bg-red-50 opacity-60' : 'border-gray-200 bg-gray-50'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.menuItem?.name || 'Item'}</div>
                  <div className="text-xs text-gray-500">₹{Number(item.unitPrice).toFixed(2)} each</div>
                </div>
                {!item.toDelete && (
                  <div className="flex items-center gap-1 mx-2">
                    <button type="button" onClick={() => updateEditQty(item.id, -1)} className="p-1 hover:bg-gray-200 rounded" disabled={item.editQty <= 1}>
                      <Minus size={14} />
                    </button>
                    <span className="font-semibold w-6 text-center text-sm">{item.editQty}</span>
                    <button type="button" onClick={() => updateEditQty(item.id, 1)} className="p-1 hover:bg-gray-200 rounded">
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      title="Add note"
                      onClick={() => setEditItems((prev) => prev.map((it) => it.id === item.id ? { ...it, showNote: !it.showNote } : it))}
                      className={`p-1 rounded ml-1 ${item.note?.trim() ? 'text-orange-500' : 'text-gray-400 hover:bg-gray-200'}`}
                    >
                      <StickyNote size={14} />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => markEditDelete(item.id)}
                  title={item.toDelete ? 'Undo remove' : 'Remove item'}
                  className={`p-1 rounded ${item.toDelete ? 'text-green-600 hover:bg-green-100' : 'text-red-500 hover:bg-red-100'}`}
                >
                  {item.toDelete ? <Plus size={16} /> : <Trash2 size={16} />}
                </button>
              </div>
              {!item.toDelete && item.showNote && (
                <input
                  type="text"
                  value={item.note}
                  onChange={(e) => setEditItems((prev) => prev.map((it) => it.id === item.id ? { ...it, note: e.target.value } : it))}
                  className="mt-2 w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-orange-400"
                  placeholder="Item note..."
                />
              )}
              {!item.toDelete && item.note?.trim() && !item.showNote && (
                <div className="mt-1 text-xs text-orange-600 italic">📝 {item.note}</div>
              )}
              {item.toDelete && <div className="text-xs text-red-500 mt-1">Will be removed</div>}
            </div>
          ))}
          <div className="flex gap-3 pt-2 border-t">
            <Button variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" disabled={editLoading} onClick={submitEditOrder}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hidden PrintableBill for window.print() */}
      {selectedBill && (
        <PrintableBill
          bill={selectedBill}
          table={parcelTableInfo}
          orders={parcelOrders}
          restaurantInfo={restaurantInfo}
        />
      )}
    </div>
  );
};

export default ParcelOrders;
