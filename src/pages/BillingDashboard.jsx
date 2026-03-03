import { useState } from 'react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Minus, Trash2, User, CreditCard, Clock, Check } from 'lucide-react';

const BillingDashboard = () => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const tables = [
    { id: 1, number: 1, status: 'available', seats: 4 },
    { id: 2, number: 2, status: 'occupied', seats: 2, orders: 3 },
    { id: 3, number: 3, status: 'occupied', seats: 4, orders: 5 },
    { id: 4, number: 4, status: 'available', seats: 6 },
    { id: 5, number: 5, status: 'reserved', seats: 4 },
    { id: 6, number: 6, status: 'available', seats: 2 },
    { id: 7, number: 7, status: 'occupied', seats: 4, orders: 2 },
    { id: 8, number: 8, status: 'available', seats: 8 },
  ];

  const menuCategories = [
    { id: 1, name: 'Starters', items: 12 },
    { id: 2, name: 'Main Course', items: 25 },
    { id: 3, name: 'Desserts', items: 15 },
    { id: 4, name: 'Beverages', items: 20 },
    { id: 5, name: 'Specials', items: 8 },
  ];

  const menuItems = [
    { id: 1, name: 'Paneer Tikka', price: 280, category: 'Starters' },
    { id: 2, name: 'Chicken Biryani', price: 320, category: 'Main Course' },
    { id: 3, name: 'Dal Makhani', price: 240, category: 'Main Course' },
    { id: 4, name: 'Gulab Jamun', price: 80, category: 'Desserts' },
    { id: 5, name: 'Cold Coffee', price: 120, category: 'Beverages' },
  ];

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

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-500 text-green-700';
      case 'occupied': return 'bg-orange-100 border-orange-500 text-orange-700';
      case 'reserved': return 'bg-blue-100 border-blue-500 text-blue-700';
      default: return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Billing Dashboard" />
      
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables Section */}
          <div className="lg:col-span-2">
            <Card title="Tables" className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`
                      p-6 rounded-lg border-2 transition-all hover:shadow-lg
                      ${getTableStatusColor(table.status)}
                      ${selectedTable?.id === table.id ? 'ring-4 ring-orange-300' : ''}
                    `}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">T{table.number}</div>
                      <div className="text-sm capitalize mb-1">{table.status}</div>
                      <div className="text-xs flex items-center justify-center gap-1">
                        <User size={14} />
                        {table.seats} seats
                      </div>
                      {table.orders && (
                        <div className="mt-2 text-xs font-semibold">
                          {table.orders} items
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Menu Items */}
            <Card title="Menu">
              <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                {menuCategories.map(category => (
                  <button
                    key={category.id}
                    className="px-4 py-2 bg-gray-100 hover:bg-orange-500 hover:text-white rounded-lg whitespace-nowrap transition-colors"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {menuItems.map(item => (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors cursor-pointer"
                    onClick={() => addToOrder(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                      <div className="text-orange-600 font-bold">₹{item.price}</div>
                    </div>
                    <div className="mt-2">
                      <Button size="sm" variant="primary" className="w-full">
                        <Plus size={16} className="mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card title={selectedTable ? `Table ${selectedTable.number} Order` : 'Select a Table'}>
              <div className="space-y-4">
                {selectedTable ? (
                  <>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Table:</span>
                        <span className="font-semibold">T{selectedTable.number}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-semibold capitalize">{selectedTable.status}</span>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {orderItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          No items added yet
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
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="font-semibold w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Plus size={16} />
                              </button>
                              <button
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

                    <div className="border-t-2 border-gray-300 pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>₹{calculateTotal()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>GST (5%):</span>
                          <span>₹{(calculateTotal() * 0.05).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-orange-600">₹{(calculateTotal() * 1.05).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="success"
                        className="w-full"
                        icon={<CreditCard size={18} />}
                        onClick={() => setShowPaymentModal(true)}
                        disabled={orderItems.length === 0}
                      >
                        Process Payment
                      </Button>
                      <Button
                        variant="danger"
                        className="w-full"
                        icon={<Clock size={18} />}
                        onClick={() => setShowCloseModal(true)}
                        disabled={orderItems.length === 0}
                      >
                        Close Table
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
                ₹{(calculateTotal() * 1.05).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 border-2 border-orange-500 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <CreditCard className="mx-auto mb-2" size={24} />
                <div className="text-sm font-medium">Cash</div>
              </button>
              <button className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <CreditCard className="mx-auto mb-2" size={24} />
                <div className="text-sm font-medium">Card</div>
              </button>
              <button className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <CreditCard className="mx-auto mb-2" size={24} />
                <div className="text-sm font-medium">UPI</div>
              </button>
              <button className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <CreditCard className="mx-auto mb-2" size={24} />
                <div className="text-sm font-medium">Other</div>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button variant="success" className="flex-1" icon={<Check size={18} />}>
              Confirm Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close Table Modal */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Close Table Confirmation"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to close Table {selectedTable?.number}? This will clear all pending orders.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCloseModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1">
              Close Table
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BillingDashboard;
