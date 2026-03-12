import { useEffect, useState, useCallback } from 'react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ToastContainer from '../components/common/Toast';
import useToast from '../hooks/useToast';
import { useSocket } from '../hooks/useSocket';
import { Plus, Edit, Trash2, Grid, RefreshCw, Layers } from 'lucide-react';
import MenuService from '../services/menu.service';

const extractList = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

const MenuCategories = () => {
  const { toasts, toast, dismissToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayOrder: 1,
  });

  // ─── Data Fetching ───────────────────────────────────────────

  const fetchCategories = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const response = await MenuService.getCategories();
      setCategories(extractList(response));
    } catch (err) {
      console.error('Failed to load categories:', err);
      if (showSpinner) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to load categories');
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Silent background refresh triggered by socket events
  const silentRefresh = useCallback(() => {
    fetchCategories(false);
  }, [fetchCategories]);

  // Real-time: re-fetch when any category or menu item changes
  useSocket('category:updated', useCallback(() => silentRefresh(), [silentRefresh]));
  useSocket('menu:updated', useCallback(() => silentRefresh(), [silentRefresh]));

  // ─── Handlers ────────────────────────────────────────────────

  const handleAdd = useCallback(() => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', displayOrder: categories.length + 1 });
    setShowModal(true);
  }, [categories.length]);

  const handleEdit = useCallback((category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder ?? 1,
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (category) => {
    const itemCount = category._count?.menuItems || category.menuItems?.length || 0;
    if (itemCount > 0) {
      toast.error(`Cannot delete "${category.name}" — it has ${itemCount} menu item(s). Remove them first.`);
      return;
    }
    if (!window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) return;

    try {
      setActionLoading(true);
      await MenuService.deleteCategory(category.id);
      await fetchCategories(false);
      toast.success(`Category "${category.name}" deleted`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete category');
    } finally {
      setActionLoading(false);
    }
  }, [fetchCategories]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      toast.error('Category name is required');
      return;
    }

    const payload = {
      name,
      description: formData.description.trim() || undefined,
      displayOrder: Number(formData.displayOrder) || 0,
    };

    try {
      setActionLoading(true);
      if (editingCategory) {
        await MenuService.updateCategory(editingCategory.id, payload);
        toast.success(`Category "${name}" updated`);
      } else {
        await MenuService.createCategory(payload);
        toast.success(`Category "${name}" created`);
      }
      setShowModal(false);
      await fetchCategories(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save category');
    } finally {
      setActionLoading(false);
    }
  }, [formData, editingCategory, fetchCategories]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Menu Categories" />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Manage Categories</h3>
            <p className="text-sm text-gray-500">
              {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} configured
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchCategories()}
              className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
              title="Refresh"
              aria-label="Refresh categories"
            >
              <RefreshCw size={18} />
            </button>
            <Button
              variant="primary"
              icon={<Plus size={18} />}
              onClick={handleAdd}
              disabled={actionLoading}
            >
              Add Category
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <Grid size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Categories Yet</h3>
            <p className="text-gray-500 mb-6">Start by adding your first menu category</p>
            <Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>
              Add First Category
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const itemCount = category._count?.menuItems || category.menuItems?.length || 0;
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="h-28 rounded-lg flex items-center justify-center bg-orange-50">
                      <Layers size={44} className="text-orange-400" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{category.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
                            {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </span>
                          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                            Order #{category.displayOrder ?? 0}
                          </span>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Edit"
                            disabled={actionLoading}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Delete"
                            disabled={actionLoading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Starters, Main Course, Desserts"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              rows="3"
              placeholder="Brief description of this category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              min="0"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first in the menu.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={actionLoading}
            >
              {actionLoading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MenuCategories;
