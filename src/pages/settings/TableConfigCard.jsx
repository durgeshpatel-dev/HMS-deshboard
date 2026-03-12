/**
 * Table Configuration Card - Settings Sub-component
 * Handles table CRUD, status management, real-time updates.
 */
import { useState, useCallback, useEffect } from 'react';
import { Table2, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useSocket } from '../../hooks/useSocket';
import TableService from '../../services/table.service';

const TABLE_STATUS_OPTIONS = ['available', 'occupied', 'reserved', 'cleaning'];
const TABLE_LOCATION_OPTIONS = ['Indoor', 'Outdoor', 'VIP', 'Terrace', 'Bar', 'Private Room'];

const extractList = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

const extractObject = (response) => {
  if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) return response.data;
  if (response && typeof response === 'object' && !Array.isArray(response)) return response;
  return {};
};

const getStatusPillClasses = (status) => {
  if (status === 'available') return 'bg-green-100 text-green-700';
  if (status === 'occupied') return 'bg-orange-100 text-orange-700';
  if (status === 'reserved') return 'bg-blue-100 text-blue-700';
  if (status === 'cleaning') return 'bg-gray-200 text-gray-700';
  return 'bg-gray-100 text-gray-600';
};

const TableConfigCard = ({ toast }) => {
  const [tables, setTables] = useState([]);
  const [tableStats, setTableStats] = useState({ total: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0 });
  const [tablesLoading, setTablesLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [form, setForm] = useState({ name: '', capacity: 2, location: '' });

  const loadTableData = useCallback(async (silent = false) => {
    try {
      if (!silent) setTablesLoading(true);
      const [tablesRes, availableRes, statsRes] = await Promise.all([
        TableService.getTables(),
        TableService.getAvailableTables(),
        TableService.getTableStats(),
      ]);
      const allTables = extractList(tablesRes);
      const available = extractList(availableRes);
      const stats = extractObject(statsRes);

      setTables(allTables);
      setTableStats({
        total: Number(stats.total ?? allTables.length),
        available: Number(stats.available ?? available.length),
        occupied: Number(stats.occupied ?? 0),
        reserved: Number(stats.reserved ?? 0),
        cleaning: Number(stats.cleaning ?? 0),
      });
    } catch (error) {
      console.error('Failed to load table data:', error);
      if (!silent) toast.error(error?.response?.data?.message || 'Failed to load table data');
    } finally {
      if (!silent) setTablesLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadTableData(); }, [loadTableData]);

  // Real-time updates
  useSocket('table:updated', useCallback(() => { loadTableData(true); }, [loadTableData]));

  const handleAdd = useCallback(() => {
    setEditingTable(null);
    setForm({ name: '', capacity: 2, location: '' });
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((table) => {
    setEditingTable(table);
    setForm({
      name: table.tableNumber || table.name || '',
      capacity: Number(table.capacity) || 2,
      location: table.location || '',
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (tableId) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      try {
        setActionLoading(true);
        await TableService.deleteTable(tableId);
        await loadTableData();
        toast.success('Table deleted successfully');
      } catch (error) {
        console.error('Failed to delete table:', error);
        toast.error(error?.response?.data?.message || 'Failed to delete table');
      } finally {
        setActionLoading(false);
      }
    }
  }, [loadTableData, toast]);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) { toast.error('Please enter table number / name'); return; }
    if (!form.capacity || form.capacity < 1) { toast.error('Capacity must be at least 1'); return; }

    const payload = {
      tableNumber: form.name.trim(),
      capacity: Number(form.capacity),
      ...(form.location ? { location: form.location } : {}),
    };

    try {
      setActionLoading(true);
      if (editingTable) {
        await TableService.updateTable(editingTable.id, payload);
        toast.success(`Table "${payload.tableNumber}" updated successfully`);
      } else {
        await TableService.createTable(payload);
        toast.success(`Table "${payload.tableNumber}" added successfully`);
      }
      await loadTableData();
      setShowModal(false);
      setEditingTable(null);
      setForm({ name: '', capacity: 2, location: '' });
    } catch (error) {
      console.error('Failed to save table:', error);
      toast.error(error?.response?.data?.message || 'Failed to save table');
    } finally {
      setActionLoading(false);
    }
  }, [form, editingTable, loadTableData, toast]);

  const handleStatusChange = useCallback(async (tableId, status) => {
    try {
      setStatusLoadingId(tableId);
      await TableService.updateTableStatus(tableId, status);
      await loadTableData();
    } catch (error) {
      console.error('Failed to update table status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update table status');
    } finally {
      setStatusLoadingId(null);
    }
  }, [loadTableData, toast]);

  return (
    <>
      <Card
        title="Table Configuration"
        icon={<Table2 size={20} />}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={handleAdd} disabled={actionLoading || tablesLoading}>
            Add Table
          </Button>
        }
        className="mb-6"
      >
        {/* Stats strip */}
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

        {/* Table list */}
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
                    <td className="py-3 px-4 font-semibold text-gray-900">{table.tableNumber || table.name || table.id}</td>
                    <td className="py-3 px-4 text-gray-700">{table.capacity} persons</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {table.location ? (
                        <span className="flex items-center gap-1"><MapPin size={13} className="text-gray-400" />{table.location}</span>
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
                          onChange={(e) => handleStatusChange(table.id, e.target.value)}
                          disabled={statusLoadingId === table.id}
                          aria-label={`Update status for ${table.tableNumber || table.name || table.id}`}
                        >
                          {TABLE_STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(table)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Table" disabled={actionLoading}>
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(table.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Table" disabled={actionLoading}>
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

      {/* Add/Edit Table Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTable ? 'Edit Table' : 'Add New Table'}>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Table Number / Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., T1 or VIP-1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (persons) *</label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 2 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location / Section</label>
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="">None / Not specified</option>
                {TABLE_LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Helps waiters find tables faster on the floor plan.</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1" disabled={actionLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={actionLoading}>
                {actionLoading ? 'Saving...' : (editingTable ? 'Update Table' : 'Add Table')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default TableConfigCard;
