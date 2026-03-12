/**
 * Settings Page - Optimized Premium Version
 * Handles Restaurant Info, Tables, and Payment Methods
 * Staff Management moved to dedicated /staff page
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Building2, CreditCard, Table2, Save, Plus, Pencil, Trash2, Upload, MapPin, Percent, Receipt } from 'lucide-react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ToastContainer from '../components/common/Toast';
import useToast from '../hooks/useToast';
import { useSocket } from '../hooks/useSocket';
import TableService from '../services/table.service';
import SettingsService from '../services/settings.service';

const TABLE_STATUS_OPTIONS = ['available', 'occupied', 'reserved', 'cleaning'];
const TABLE_LOCATION_OPTIONS = ['Indoor', 'Outdoor', 'VIP', 'Terrace', 'Bar', 'Private Room'];

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
  const { toasts, toast, dismissToast } = useToast();

  // Restaurant Info State
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    openingTime: '10:00',
    closingTime: '23:00',
    logo: null
  });
  const [restaurantInfoLoading, setRestaurantInfoLoading] = useState(false);
  const [restaurantInfoSaving, setRestaurantInfoSaving] = useState(false);

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
  const [paymentMethodsSaving, setPaymentMethodsSaving] = useState(null);

  // Tax & Billing State
  const [taxSettings, setTaxSettings] = useState({
    taxPercentage: 5,
    gstNumber: '',
  });
  const [taxSettingsSaving, setTaxSettingsSaving] = useState(false);

  // Modal States
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableForm, setTableForm] = useState({ name: '', capacity: 2, location: '' });

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
      toast.error(error?.response?.data?.message || 'Failed to load table data');
    } finally {
      setTablesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTableData();
    loadRestaurantSettings();
  }, [loadTableData]);

  // Load restaurant settings from API on mount
  const loadRestaurantSettings = useCallback(async () => {
    try {
      setRestaurantInfoLoading(true);
      const response = await SettingsService.getRestaurantSettings();
      const data = response.data || response;
      
      // Extract restaurant info
      setRestaurantInfo(prev => ({
        ...prev,
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        openingTime: data.settings?.openingTime || '10:00',
        closingTime: data.settings?.closingTime || '23:00',
        logo: data.logo || null,
      }));

      // Extract payment methods from settings
      if (data.settings?.paymentMethods && Array.isArray(data.settings.paymentMethods)) {
        setPaymentMethods(data.settings.paymentMethods);
      }

      // Extract tax & billing settings
      setTaxSettings({
        taxPercentage: Number(data.settings?.taxPercentage ?? data.settings?.tax_percentage ?? 5),
        gstNumber: data.settings?.gstNumber || '',
      });
    } catch (error) {
      console.error('Failed to load restaurant settings:', error);
      toast.error(error?.response?.data?.message || 'Failed to load restaurant settings');
    } finally {
      setRestaurantInfoLoading(false);
    }
  }, [toast]);

  // Silent background refresh for real-time socket updates (no loading spinner)
  const silentRefreshTableData = useCallback(async () => {
    try {
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
      console.error('Silent table refresh failed:', error);
    }
  }, []);

  // Real-time table updates via socket (from waiter app, other managers, etc.)
  useSocket('table:updated', useCallback(() => {
    silentRefreshTableData();
  }, [silentRefreshTableData]));

  // Restaurant Info Handlers (Optimized with useCallback)
  const handleRestaurantInfoChange = useCallback((field, value) => {
    setRestaurantInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveRestaurantInfo = useCallback(async () => {
    if (!restaurantInfo.name || !restaurantInfo.phone || !restaurantInfo.email || !restaurantInfo.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setRestaurantInfoSaving(true);
      
      // Update restaurant info (name, phone, email, address)
      await SettingsService.updateRestaurantInfo({
        name: restaurantInfo.name,
        phone: restaurantInfo.phone,
        email: restaurantInfo.email,
        address: restaurantInfo.address,
      });

      // Update restaurant settings (opening/closing times)
      await SettingsService.updateRestaurantSettings({
        openingTime: restaurantInfo.openingTime,
        closingTime: restaurantInfo.closingTime,
      });

      toast.success('Restaurant information saved successfully!');
    } catch (error) {
      console.error('Failed to save restaurant info:', error);
      toast.error(error?.response?.data?.message || 'Failed to save restaurant information');
    } finally {
      setRestaurantInfoSaving(false);
    }
  }, [restaurantInfo, toast]);

  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRestaurantInfo(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSaveTaxSettings = useCallback(async () => {
    const pct = Number(taxSettings.taxPercentage);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Tax percentage must be between 0 and 100');
      return;
    }
    try {
      setTaxSettingsSaving(true);
      await SettingsService.updateRestaurantSettings({
        taxPercentage: pct,
        gstNumber: taxSettings.gstNumber.trim(),
      });
      toast.success('Tax & billing settings saved successfully!');
    } catch (error) {
      console.error('Failed to save tax settings:', error);
      toast.error(error?.response?.data?.message || 'Failed to save tax settings');
    } finally {
      setTaxSettingsSaving(false);
    }
  }, [taxSettings, toast]);

  // Table Handlers (Optimized)
  const handleAddTable = useCallback(() => {
    setEditingTable(null);
    setTableForm({ name: '', capacity: 2, location: '' });
    setShowTableModal(true);
  }, []);

  const handleEditTable = useCallback((table) => {
    setEditingTable(table);
    setTableForm({
      name: table.tableNumber || table.name || '',
      capacity: Number(table.capacity) || 2,
      location: table.location || '',
    });
    setShowTableModal(true);
  }, []);

  const handleDeleteTable = useCallback(async (tableId) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      try {
        setTableActionLoading(true);
        await TableService.deleteTable(tableId);
        await loadTableData();
        toast.success('Table deleted successfully');
      } catch (error) {
        console.error('Failed to delete table:', error);
        toast.error(error?.response?.data?.message || 'Failed to delete table');
      } finally {
        setTableActionLoading(false);
      }
    }
  }, [loadTableData]);

  const handleSaveTable = useCallback(async () => {
    if (!tableForm.name.trim()) {
      toast.error('Please enter table number / name');
      return;
    }
    if (!tableForm.capacity || tableForm.capacity < 1) {
      toast.error('Capacity must be at least 1');
      return;
    }

    const payload = {
      tableNumber: tableForm.name.trim(),
      capacity: Number(tableForm.capacity),
      ...(tableForm.location ? { location: tableForm.location } : {}),
    };

    try {
      setTableActionLoading(true);
      if (editingTable) {
        await TableService.updateTable(editingTable.id, payload);
        toast.success(`Table "${payload.tableNumber}" updated successfully`);
      } else {
        await TableService.createTable(payload);
        toast.success(`Table "${payload.tableNumber}" added successfully`);
      }

      await loadTableData();
      setShowTableModal(false);
      setEditingTable(null);
      setTableForm({ name: '', capacity: 2, location: '' });
    } catch (error) {
      console.error('Failed to save table:', error);
      toast.error(error?.response?.data?.message || 'Failed to save table');
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
      toast.error(error?.response?.data?.message || 'Failed to update table status');
    } finally {
      setTableStatusLoadingId(null);
    }
  }, [loadTableData]);

  // Payment Method Handlers (Optimized with auto-save)
  const handleTogglePaymentMethod = useCallback(async (methodId) => {
    // Update local state first for instant UI feedback
    const updatedMethods = paymentMethods.map(pm => 
      pm.id === methodId ? { ...pm, enabled: !pm.enabled } : pm
    );
    setPaymentMethods(updatedMethods);
    setPaymentMethodsSaving(methodId);

    try {
      // Persist to backend
      await SettingsService.updateRestaurantSettings({
        paymentMethods: updatedMethods,
      });
      toast.success('Payment method updated successfully');
    } catch (error) {
      console.error('Failed to update payment method:', error);
      toast.error(error?.response?.data?.message || 'Failed to update payment method');
      // Revert state on error
      setPaymentMethods(paymentMethods);
    } finally {
      setPaymentMethodsSaving(null);
    }
  }, [paymentMethods, toast]);

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
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
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
              disabled={!isRestaurantInfoValid || restaurantInfoSaving || restaurantInfoLoading}
            >
              {restaurantInfoSaving ? 'Saving...' : 'Save Restaurant Info'}
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
            Available tables: <span className="font-semibold text-gray-900">{tableStats.available}</span>
            &nbsp;·&nbsp; Total: <span className="font-semibold text-gray-900">{tableStats.total}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Table #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Capacity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Location</th>
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
                    <td colSpan="5" className="py-8 text-center text-gray-400">
                      No tables configured yet. Click &ldquo;Add Table&rdquo; to get started.
                    </td>
                  </tr>
                ) : (
                  tables.map((table) => (
                    <tr key={table.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {table.tableNumber || table.name || table.id}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{table.capacity} persons</td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {table.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-gray-400" />
                            {table.location}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
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
                      disabled={paymentMethodsSaving === method.id}
                      className="sr-only peer"
                      aria-label={`Toggle ${method.name}`}
                    />
                    <div className={`w-11 h-6 ${paymentMethodsSaving === method.id ? 'opacity-50' : ''} bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500`}></div>
                  </label>
                </div>
                <p className="text-xs text-gray-600">
                  {method.enabled ? 'Enabled for customers' : 'Disabled'}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Tax & Billing */}
        <Card
          title="Tax & Billing"
          icon={<Receipt size={20} />}
          className="mt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={taxSettings.taxPercentage}
                  onChange={(e) => setTaxSettings(prev => ({ ...prev, taxPercentage: e.target.value }))}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                  placeholder="e.g. 5"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Percent size={16} />
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Applied to all orders. This rate appears on printed bills.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                value={taxSettings.gstNumber}
                onChange={(e) => setTaxSettings(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors font-mono tracking-wider"
                placeholder="e.g. 22AAAAA0000A1Z5"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                Printed on every bill for GST compliance. Leave blank if not applicable.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={handleSaveTaxSettings}
              disabled={taxSettingsSaving}
            >
              {taxSettingsSaving ? 'Saving...' : 'Save Tax Settings'}
            </Button>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location / Section
              </label>
              <select
                value={tableForm.location}
                onChange={(e) => setTableForm({ ...tableForm, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="">None / Not specified</option>
                {TABLE_LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Helps waiters find tables faster on the floor plan.
              </p>
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
