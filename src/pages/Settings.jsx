import { useState } from 'react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Building2, Users, CreditCard, Table2, Save, Plus, Pencil, Trash2, Upload } from 'lucide-react';

const Settings = () => {
  // Restaurant Info State
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'The Golden Spoon',
    address: '123 Main Street, Downtown',
    phone: '+91 98765 43210',
    email: 'contact@goldenspoon.com',
    openingTime: '10:00',
    closingTime: '23:00',
    logo: null
  });

  // Tables State
  const [tables, setTables] = useState([
    { id: 'T1', name: 'Table 1', capacity: 4, status: 'available' },
    { id: 'T2', name: 'Table 2', capacity: 2, status: 'available' },
    { id: 'T3', name: 'Table 3', capacity: 6, status: 'available' },
    { id: 'T4', name: 'Table 4', capacity: 4, status: 'available' },
    { id: 'T5', name: 'Table 5', capacity: 8, status: 'available' },
  ]);

  // Staff State
  const [staff, setStaff] = useState([
    { id: 1, name: 'John Doe', role: 'Manager', phone: '+91 98765 11111', pin: '1234', active: true },
    { id: 2, name: 'Jane Smith', role: 'Waiter', phone: '+91 98765 22222', pin: '5678', active: true },
    { id: 3, name: 'Mike Wilson', role: 'Chef', phone: '+91 98765 33333', pin: '9012', active: true },
  ]);

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: 'Cash', enabled: true },
    { id: 2, name: 'Card', enabled: true },
    { id: 3, name: 'UPI', enabled: true },
    { id: 4, name: 'Online', enabled: false },
  ]);

  // Modal States
  const [showTableModal, setShowTableModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);

  // Form States
  const [tableForm, setTableForm] = useState({ name: '', capacity: 2 });
  const [staffForm, setStaffForm] = useState({ name: '', role: 'Waiter', phone: '', pin: '' });

  // Restaurant Info Handlers
  const handleRestaurantInfoChange = (field, value) => {
    setRestaurantInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveRestaurantInfo = () => {
    console.log('Saving restaurant info:', restaurantInfo);
    alert('Restaurant information saved successfully!');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRestaurantInfo(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Table Handlers
  const handleAddTable = () => {
    setEditingTable(null);
    setTableForm({ name: '', capacity: 2 });
    setShowTableModal(true);
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setTableForm({ name: table.name, capacity: table.capacity });
    setShowTableModal(true);
  };

  const handleDeleteTable = (tableId) => {
    if (confirm('Are you sure you want to delete this table?')) {
      setTables(prev => prev.filter(t => t.id !== tableId));
    }
  };

  const handleSaveTable = () => {
    if (!tableForm.name.trim()) {
      alert('Please enter table name');
      return;
    }

    if (editingTable) {
      setTables(prev => prev.map(t => 
        t.id === editingTable.id 
          ? { ...t, name: tableForm.name, capacity: tableForm.capacity }
          : t
      ));
    } else {
      const newTable = {
        id: `T${tables.length + 1}`,
        name: tableForm.name,
        capacity: tableForm.capacity,
        status: 'available'
      };
      setTables(prev => [...prev, newTable]);
    }
    setShowTableModal(false);
  };

  // Staff Handlers
  const handleAddStaff = () => {
    setEditingStaff(null);
    setStaffForm({ name: '', role: 'Waiter', phone: '', pin: '' });
    setShowStaffModal(true);
  };

  const handleEditStaff = (member) => {
    setEditingStaff(member);
    setStaffForm({ 
      name: member.name, 
      role: member.role, 
      phone: member.phone, 
      pin: member.pin 
    });
    setShowStaffModal(true);
  };

  const handleDeleteStaff = (staffId) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      setStaff(prev => prev.filter(s => s.id !== staffId));
    }
  };

  const handleToggleStaffStatus = (staffId) => {
    setStaff(prev => prev.map(s => 
      s.id === staffId ? { ...s, active: !s.active } : s
    ));
  };

  const handleSaveStaff = () => {
    if (!staffForm.name.trim() || !staffForm.phone.trim() || !staffForm.pin.trim()) {
      alert('Please fill all required fields');
      return;
    }

    if (staffForm.pin.length !== 4 || !/^\d+$/.test(staffForm.pin)) {
      alert('PIN must be exactly 4 digits');
      return;
    }

    if (editingStaff) {
      setStaff(prev => prev.map(s => 
        s.id === editingStaff.id 
          ? { ...s, ...staffForm }
          : s
      ));
    } else {
      const newStaff = {
        id: staff.length + 1,
        ...staffForm,
        active: true
      };
      setStaff(prev => [...prev, newStaff]);
    }
    setShowStaffModal(false);
  };

  // Payment Method Handlers
  const handleTogglePaymentMethod = (methodId) => {
    setPaymentMethods(prev => prev.map(pm => 
      pm.id === methodId ? { ...pm, enabled: !pm.enabled } : pm
    ));
  };

  return (
    <div className="min-h-screen">
      <Header title="Settings" />
      
      <div className="p-8">
        {/* Restaurant Information */}
        <Card 
          title="Restaurant Information" 
          icon={<Building2 size={20} />}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name *
              </label>
              <input
                type="text"
                value={restaurantInfo.name}
                onChange={(e) => handleRestaurantInfoChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter restaurant name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={restaurantInfo.phone}
                onChange={(e) => handleRestaurantInfoChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={restaurantInfo.email}
                onChange={(e) => handleRestaurantInfoChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="contact@restaurant.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                value={restaurantInfo.address}
                onChange={(e) => handleRestaurantInfoChange('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Time *
              </label>
              <input
                type="time"
                value={restaurantInfo.openingTime}
                onChange={(e) => handleRestaurantInfoChange('openingTime', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Closing Time *
              </label>
              <input
                type="time"
                value={restaurantInfo.closingTime}
                onChange={(e) => handleRestaurantInfoChange('closingTime', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Logo
              </label>
              <div className="flex items-center gap-4">
                {restaurantInfo.logo && (
                  <img 
                    src={restaurantInfo.logo} 
                    alt="Restaurant Logo" 
                    className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                  />
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors">
                    <Upload size={16} />
                    {restaurantInfo.logo ? 'Change Logo' : 'Upload Logo'}
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              variant="primary" 
              icon={<Save size={16} />}
              onClick={handleSaveRestaurantInfo}
            >
              Save Restaurant Info
            </Button>
          </div>
        </Card>

        {/* Tables Configuration */}
        <Card 
          title="Table Configuration" 
          icon={<Table2 size={20} />}
          action={
            <Button 
              variant="primary" 
              size="sm" 
              icon={<Plus size={16} />}
              onClick={handleAddTable}
            >
              Add Table
            </Button>
          }
          className="mb-6"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Table ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Capacity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => (
                  <tr key={table.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-900">{table.id}</td>
                    <td className="py-3 px-4 text-gray-700">{table.name}</td>
                    <td className="py-3 px-4 text-gray-700">{table.capacity} persons</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        {table.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditTable(table)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Staff Management */}
        <Card 
          title="Staff Management" 
          icon={<Users size={20} />}
          action={
            <Button 
              variant="primary" 
              size="sm" 
              icon={<Plus size={16} />}
              onClick={handleAddStaff}
            >
              Add Staff
            </Button>
          }
          className="mb-6"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">PIN</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-900">{member.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        member.role === 'Manager' ? 'bg-purple-100 text-purple-700' :
                        member.role === 'Chef' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{member.phone}</td>
                    <td className="py-3 px-4 text-gray-700 font-mono">••••</td>
                    <td className="py-3 px-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.active}
                          onChange={() => handleToggleStaffStatus(member.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditStaff(member)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(member.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card 
          title="Payment Methods" 
          icon={<CreditCard size={20} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethods.map((method) => (
              <div 
                key={method.id}
                className={`p-4 border-2 rounded-lg transition-all ${
                  method.enabled 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{method.name}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={method.enabled}
                      onChange={() => handleTogglePaymentMethod(method.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-600">
                  {method.enabled ? 'Enabled for customers' : 'Disabled'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Table Modal */}
      <Modal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        title={editingTable ? 'Edit Table' : 'Add New Table'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Table Name *
            </label>
            <input
              type="text"
              value={tableForm.name}
              onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Table 1, VIP Table"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacity (persons) *
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={tableForm.capacity}
              onChange={(e) => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) || 2 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowTableModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveTable} className="flex-1">
              {editingTable ? 'Update Table' : 'Add Table'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Staff Modal */}
      <Modal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        title={editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={staffForm.role}
              onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Manager">Manager</option>
              <option value="Waiter">Waiter</option>
              <option value="Chef">Chef</option>
              <option value="Cashier">Cashier</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={staffForm.phone}
              onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              4-Digit PIN *
            </label>
            <input
              type="password"
              maxLength="4"
              value={staffForm.pin}
              onChange={(e) => setStaffForm({ ...staffForm, pin: e.target.value.replace(/\D/g, '') })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter 4-digit PIN"
            />
            <p className="text-xs text-gray-500 mt-1">This PIN will be used for staff authentication</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowStaffModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveStaff} className="flex-1">
              {editingStaff ? 'Update Staff' : 'Add Staff'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
