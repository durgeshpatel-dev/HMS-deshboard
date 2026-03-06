/**
 * Settings Page - Optimized Premium Version
 * Handles Restaurant Info, Tables, and Payment Methods
 * Staff Management moved to dedicated /staff page
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Building2, CreditCard, Table2, Save, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import TableService from '../services/table.service';

const TABLE_STATUS_OPTIONS = ['available', 'occupied', 'reserved', 'cleaning'];

const extractList = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

const extractObject = (response) => {
  if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    return response.data;
  }
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    return response;
  }
  return {};
};

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
  const [tables, setTables] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [tableStats, setTableStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    reserved: 0,
    cleaning: 0,
  });
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tableActionLoading, setTableActionLoading] = useState(false);
  const [tableStatusLoadingId, setTableStatusLoadingId] = useState(null);

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: 'Cash', enabled: true },
    { id: 2, name: 'Card', enabled: true },
    { id: 3, name: 'UPI', enabled: true },
    { id: 4, name: 'Online', enabled: false },
  ]);

  // Modal States
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableForm, setTableForm] = useState({ name: '', capacity: 2 });

  const loadTableData = useCallback(async () => {
    try {
      setTablesLoading(true);
      const [tablesResponse, availableResponse, statsResponse] = await Promise.all([
        TableService.getTables(),
        TableService.getAvailableTables(),
        TableService.getTableStats(),
      ]);

      const allTables = extractList(tablesResponse);
      const available = extractList(availableResponse);
      const stats = extractObject(statsResponse);

      setTables(allTables);
      setAvailableTables(available);
      setTableStats({
        total: Number(stats.total ?? allTables.length),
        available: Number(stats.available ?? available.length),
        occupied: Number(stats.occupied ?? 0),
        reserved: Number(stats.reserved ?? 0),
        cleaning: Number(stats.cleaning ?? 0),
      });
    } catch (error) {
      console.error('Failed to load table data:', error);
      alert(error?.response?.data?.message || 'Failed to load table data');
    } finally {
      setTablesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTableData();
  }, [loadTableData]);

  // Restaurant Info Handlers (Optimized with useCallback)
  const handleRestaurantInfoChange = useCallback((field, value) => {
    setRestaurantInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveRestaurantInfo = useCallback(() => {
    console.log('Saving restaurant info:', restaurantInfo);
    // TODO: Call API to save restaurant info
    alert('Restaurant information saved successfully!');
  }, [restaurantInfo]);

  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRestaurantInfo(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Table Handlers (Optimized)
  const handleAddTable = useCallback(() => {
    setEditingTable(null);
    setTableForm({ name: '', capacity: 2 });
    setShowTableModal(true);
  }, []);

  const handleEditTable = useCallback((table) => {
    setEditingTable(table);
    setTableForm({
      name: table.tableNumber || table.name || '',
      capacity: Number(table.capacity) || 2,
    });
    setShowTableModal(true);
  }, []);

  const handleDeleteTable = useCallback(async (tableId) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      try {
        setTableActionLoading(true);
        await TableService.deleteTable(tableId);
        await loadTableData();
      } catch (error) {
        console.error('Failed to delete table:', error);
        alert(error?.response?.data?.message || 'Failed to delete table');
      } finally {
        setTableActionLoading(false);
      }
    }
  }, [loadTableData]);

  const handleSaveTable = useCallback(async () => {
    if (!tableForm.name.trim()) {
      alert('Please enter table name');
      return;
    }

    const payload = {
      tableNumber: tableForm.name.trim(),
      capacity: Number(tableForm.capacity),
    };

    try {
      setTableActionLoading(true);
      if (editingTable) {
        await TableService.updateTable(editingTable.id, payload);
      } else {
        await TableService.createTable(payload);
      }

      await loadTableData();
      setShowTableModal(false);
      setEditingTable(null);
      setTableForm({ name: '', capacity: 2 });
    } catch (error) {
      console.error('Failed to save table:', error);
      alert(error?.response?.data?.message || 'Failed to save table');
    } finally {
      setTableActionLoading(false);
    }
  }, [tableForm, editingTable, loadTableData]);

  const handleTableStatusChange = useCallback(async (tableId, status) => {
    try {
      setTableStatusLoadingId(tableId);
      await TableService.updateTableStatus(tableId, status);
      await loadTableData();
    } catch (error) {
      console.error('Failed to update table status:', error);
      alert(error?.response?.data?.message || 'Failed to update table status');
    } finally {
      setTableStatusLoadingId(null);
    }
  }, [loadTableData]);

  // Payment Method Handlers (Optimized)
  const handleTogglePaymentMethod = useCallback((methodId) => {
    setPaymentMethods(prev => prev.map(pm => 
      pm.id === methodId ? { ...pm, enabled: !pm.enabled } : pm
    ));
  }, []);

  // Memoized computations
  const isRestaurantInfoValid = useMemo(() => {
    return restaurantInfo.name && restaurantInfo.phone && restaurantInfo.email && restaurantInfo.address;
  }, [restaurantInfo]);

  const getStatusPillClasses = useCallback((status) => {
    if (status === 'available') return 'bg-green-100 text-green-700';
    if (status === 'occupied') return 'bg-orange-100 text-orange-700';
    if (status === 'reserved') return 'bg-blue-100 text-blue-700';
    if (status === 'cleaning') return 'bg-gray-200 text-gray-700';
    return 'bg-gray-100 text-gray-600';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Settings" />
      
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
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
                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
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
                <p className="text-xs text-gray-500">Max size: 2MB</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              variant="primary" 
              icon={<Save size={16} />}
              onClick={handleSaveRestaurantInfo}
              disabled={!isRestaurantInfoValid}
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
              disabled={tableActionLoading || tablesLoading}
            >
              Add Table
            </Button>
          }
          className="mb-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-gray-100">
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{tableStats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <p className="text-xs text-green-700">Available</p>
              <p className="text-xl font-bold text-green-800">{tableStats.available}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <p className="text-xs text-orange-700">Occupied</p>
              <p className="text-xl font-bold text-orange-800">{tableStats.occupied}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <p className="text-xs text-blue-700">Reserved</p>
              <p className="text-xl font-bold text-blue-800">{tableStats.reserved}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-100">
              <p className="text-xs text-slate-700">Cleaning</p>
              <p className="text-xl font-bold text-slate-800">{tableStats.cleaning}</p>
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Available tables endpoint count: <span className="font-semibold text-gray-900">{availableTables.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Table</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Capacity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tablesLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">Loading table data...</td>
                  </tr>
                ) : tables.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">No tables found.</td>
                  </tr>
                ) : (
                  tables.map((table) => (
                    <tr key={table.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {table.tableNumber || table.name || table.id}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {table.name || table.tableNumber || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{table.capacity} persons</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusPillClasses(table.status)}`}>
                            {table.status}
                          </span>
                          <select
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            value={table.status}
                            onChange={(e) => handleTableStatusChange(table.id, e.target.value)}
                            disabled={tableStatusLoadingId === table.id}
                            aria-label={`Update status for ${table.tableNumber || table.name || table.id}`}
                          >
                            {TABLE_STATUS_OPTIONS.map((statusOption) => (
                              <option key={statusOption} value={statusOption}>
                                {statusOption}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditTable(table)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Table"
                            aria-label={`Edit ${table.tableNumber || table.name || table.id}`}
                            disabled={tableActionLoading}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Table"
                            aria-label={`Delete ${table.tableNumber || table.name || table.id}`}
                            disabled={tableActionLoading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card 
          title="Payment Methods" 
          icon={<CreditCard size={20} />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      aria-label={`Toggle ${method.name}`}
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
        <form onSubmit={(e) => { e.preventDefault(); handleSaveTable(); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table Number / Name *
              </label>
              <input
                type="text"
                value={tableForm.name}
                onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., T1 or VIP-1"
                required
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
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button"
                variant="secondary" 
                onClick={() => setShowTableModal(false)} 
                className="flex-1"
                disabled={tableActionLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="primary" 
                className="flex-1"
                disabled={tableActionLoading}
              >
                {tableActionLoading ? 'Saving...' : (editingTable ? 'Update Table' : 'Add Table')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
