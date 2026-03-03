import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Plus, Minus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';

const CreateParcelOrder = () => {
  const navigate = useNavigate();
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const [orderItems, setOrderItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Starters', 'Main Course', 'Breads', 'Desserts', 'Beverages'];

  const menuItems = [
    { id: 1, name: 'Paneer Tikka', price: 280, category: 'Starters' },
    { id: 2, name: 'Chicken Biryani', price: 320, category: 'Main Course' },
    { id: 3, name: 'Dal Makhani', price: 240, category: 'Main Course' },
    { id: 4, name: 'Butter Naan', price: 40, category: 'Breads' },
    { id: 5, name: 'Gulab Jamun', price: 80, category: 'Desserts' },
    { id: 6, name: 'Cold Coffee', price: 120, category: 'Beverages' },
    { id: 7, name: 'Veg Manchurian', price: 200, category: 'Starters' },
    { id: 8, name: 'Masala Dosa', price: 150, category: 'Main Course' },
  ];

  const filteredMenuItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const addToOrder = (item) => {
    const existing = orderItems.find(oi => oi.id === item.id);
    if (existing) {
      setOrderItems(orderItems.map(oi =>
        oi.id === item.id ? { ...oi, quantity: oi.quantity + 1 } : oi
      ));
    } else {
      setOrderItems([...orderItems, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, change) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (id) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const gst = subtotal * 0.05;
    return subtotal + gst;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }
    
    // Here you would typically send the order to your backend
    alert('Order created successfully!');
    navigate('/parcel-orders');
  };

  const isFormValid = customerInfo.name && customerInfo.phone && customerInfo.address && orderItems.length > 0;

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
            {/* Left Column - Customer Info & Menu */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <Card title="Customer Information">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
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

              {/* Menu Items */}
              <Card title="Select Items">
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                  {categories.map(category => (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredMenuItems.map(item => (
                    <div
                      key={item.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">{item.name}</h4>
                          <p className="text-sm text-gray-500">{item.category}</p>
                        </div>
                        <div className="text-orange-600 font-bold">₹{item.price}</div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        className="w-full"
                        onClick={() => addToOrder(item)}
                      >
                        <Plus size={16} className="mr-1" />
                        Add to Order
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card title="Order Summary" className="sticky top-24">
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="max-h-64 overflow-y-auto">
                    {orderItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No items added yet</p>
                      </div>
                    ) : (
                      orderItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-200">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500">₹{item.price} each</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="font-semibold w-8 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="p-1 hover:bg-red-100 text-red-600 rounded ml-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Billing */}
                  {orderItems.length > 0 && (
                    <>
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-semibold">₹{calculateSubtotal()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">GST (5%):</span>
                          <span className="font-semibold">₹{(calculateSubtotal() * 0.05).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Delivery Charge:</span>
                          <span className="font-semibold">₹0</span>
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

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4">
                    <Button
                      type="submit"
                      variant="success"
                      className="w-full"
                      disabled={!isFormValid}
                    >
                      Create Order
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => navigate('/parcel-orders')}
                    >
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
