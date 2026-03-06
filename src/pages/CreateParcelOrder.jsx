import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Plus, Minus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import MenuService from '../services/menu.service';
import OrderService from '../services/order.service';

const CreateParcelOrder = () => {
  const navigate = useNavigate();

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await MenuService.getItems();
      setMenuItems(response?.data || []);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      alert('Failed to load menu items');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMenu();
  }, []);

  const categories = useMemo(() => {
    const names = menuItems.map((item) => item.category?.name).filter(Boolean);
    return ['All', ...Array.from(new Set(names))];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    const available = menuItems.filter((item) => item.isAvailable !== false);
    if (selectedCategory === 'All') return available;
    return available.filter((item) => item.category?.name === selectedCategory);
  }, [menuItems, selectedCategory]);

  const addToOrder = (item) => {
    const existing = orderItems.find((oi) => oi.id === item.id);
    if (existing) {
      setOrderItems(orderItems.map((oi) => (oi.id === item.id ? { ...oi, quantity: oi.quantity + 1 } : oi)));
    } else {
      setOrderItems([...orderItems, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, change) => {
    setOrderItems(
      orderItems
        .map((item) => {
          if (item.id !== id) return item;
          const next = item.quantity + change;
          return next > 0 ? { ...item, quantity: next } : item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setOrderItems(orderItems.filter((item) => item.id !== id));
  };

  const calculateSubtotal = () => orderItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const calculateTax = () => calculateSubtotal() * 0.05;
  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        orderType: 'parcel',
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        specialNotes: customerInfo.address,
        items: orderItems.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
      };

      await OrderService.createOrder(payload);
      alert('Parcel order created successfully');
      navigate('/parcel-orders');
    } catch (error) {
      console.error('Failed to create parcel order:', error);
      alert(error?.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid =
    customerInfo.name.trim() && customerInfo.phone.trim() && customerInfo.address.trim() && orderItems.length > 0;

  return (
    <div className="min-h-screen">
      <Header title="Create Parcel Order" />

      <div className="p-8">
        <Button
          variant="secondary"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/parcel-orders')}
          className="mb-6"
        >
          Back to Orders
        </Button>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card title="Customer Information">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="input-field"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="input-field"
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address *</label>
                    <textarea
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      className="input-field resize-none"
                      rows="3"
                      placeholder="Enter delivery address"
                      required
                    />
                  </div>
                </div>
              </Card>

              <Card title="Select Items">
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        selectedCategory === category
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading menu items...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {filteredMenuItems.map((item) => (
                      <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800">{item.name}</h4>
                            <p className="text-sm text-gray-500">{item.category?.name || 'Uncategorized'}</p>
                          </div>
                          <div className="text-orange-600 font-bold">₹{Number(item.price).toFixed(2)}</div>
                        </div>
                        <Button type="button" size="sm" variant="primary" className="w-full" onClick={() => addToOrder(item)}>
                          <Plus size={16} className="mr-1" />
                          Add to Order
                        </Button>
                      </div>
                    ))}
                    {filteredMenuItems.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500">No menu items available.</div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card title="Order Summary" className="sticky top-24">
                <div className="space-y-4">
                  <div className="max-h-64 overflow-y-auto">
                    {orderItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No items added yet</p>
                      </div>
                    ) : (
                      orderItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-200">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500">₹{Number(item.price).toFixed(2)} each</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button type="button" onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded">
                              <Minus size={16} />
                            </button>
                            <span className="font-semibold w-8 text-center">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 rounded">
                              <Plus size={16} />
                            </button>
                            <button type="button" onClick={() => removeItem(item.id)} className="p-1 hover:bg-red-100 text-red-600 rounded ml-2">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {orderItems.length > 0 && (
                    <>
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-semibold">₹{calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">GST (5%):</span>
                          <span className="font-semibold">₹{calculateTax().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Delivery Charge:</span>
                          <span className="font-semibold">₹0.00</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-orange-600">₹{calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-sm font-semibold text-orange-800 mb-1">Order Details</div>
                        <div className="text-xs text-orange-600">
                          {orderItems.length} items • {orderItems.reduce((sum, item) => sum + item.quantity, 0)} total quantity
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2 pt-4">
                    <Button type="submit" variant="success" className="w-full" disabled={!isFormValid || submitting}>
                      {submitting ? 'Creating...' : 'Create Order'}
                    </Button>
                    <Button type="button" variant="secondary" className="w-full" onClick={() => navigate('/parcel-orders')}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateParcelOrder;
