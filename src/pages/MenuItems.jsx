/**
 * Menu Items Page – Full CRUD, real-time socket updates, quick availability toggle
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ToastContainer from '../components/common/Toast';
import useToast from '../hooks/useToast';
import { useSocket } from '../hooks/useSocket';
import { Plus, Edit, Trash2, Search, Upload, X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import MenuService from '../services/menu.service';
import ImageUploadService from '../services/upload.service';

const extractList = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

const MenuItems = () => {
  const { toasts, toast, dismissToast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    description: '',
    isAvailable: true,
    imageUrl: '',
    preparationTime: 15,
    isVegetarian: false,
  });

  const categories = useMemo(
    () => ['All', ...categoriesData.map((c) => c.name)],
    [categoriesData]
  );

  // ─── Data Fetching ───────────────────────────────────────────

  const fetchPageData = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const [categoriesRes, itemsRes] = await Promise.all([
        MenuService.getCategories(),
        MenuService.getItems(),
      ]);
      setCategoriesData(extractList(categoriesRes));
      setMenuItems(extractList(itemsRes));
    } catch (error) {
      console.error('Failed to fetch menu data:', error);
      if (showSpinner) {
        toast.error(error?.response?.data?.message || error?.message || 'Failed to load menu data');
      }
      setCategoriesData([]);
      setMenuItems([]);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  // Silent background refresh for socket events
  const silentRefresh = useCallback(() => {
    fetchPageData(false);
  }, [fetchPageData]);

  // Real-time updates
  useSocket('menu:updated', useCallback(() => silentRefresh(), [silentRefresh]));
  useSocket('category:updated', useCallback(() => silentRefresh(), [silentRefresh]));

  // ─── Filtering ────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' ||
        categoriesData.find((c) => c.id === item.categoryId)?.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategory, categoriesData]);

  // ─── Handlers ────────────────────────────────────────────────

  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setImagePreview(null);
    setFormData({
      name: '',
      categoryId: categoriesData[0]?.id ? String(categoriesData[0].id) : '',
      price: '',
      description: '',
      isAvailable: true,
      imageUrl: '',
      preparationTime: 15,
      isVegetarian: false,
    });
    setShowModal(true);
  }, [categoriesData]);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    const imgUrl = item.imageUrl ? ImageUploadService.getImageUrl(item.imageUrl) : null;
    setImagePreview(imgUrl);
    setFormData({
      name: item.name,
      categoryId: String(item.categoryId),
      price: item.price,
      description: item.description || '',
      isAvailable: item.isAvailable,
      imageUrl: item.imageUrl || '',
      preparationTime: item.customizations?.preparationTime ?? item.preparationTime ?? 15,
      isVegetarian: item.isVegetarian || false,
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      setActionLoading(true);
      await MenuService.deleteItem(item.id);
      await fetchPageData(false);
      toast.success(`"${item.name}" deleted`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to delete item');
    } finally {
      setActionLoading(false);
    }
  }, [fetchPageData]);

  const handleToggleAvailability = useCallback(async (item) => {
    try {
      setTogglingId(item.id);
      const newStatus = !item.isAvailable;
      await MenuService.toggleAvailability(item.id, newStatus);
      await fetchPageData(false);
      toast.success(`"${item.name}" is now ${newStatus ? 'available' : 'unavailable'}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to toggle availability');
    } finally {
      setTogglingId(null);
    }
  }, [fetchPageData]);

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await ImageUploadService.uploadImage(file);
      setFormData((prev) => ({ ...prev, imageUrl }));
      setImagePreview(imageUrl);
      toast.success('Image uploaded');
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleClearImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    setImagePreview(null);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.categoryId || !formData.price) {
      toast.error('Please fill in all required fields (Name, Category, Price)');
      return;
    }

    const payload = {
      categoryId: Number(formData.categoryId),
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      isAvailable: formData.isAvailable,
      imageUrl: formData.imageUrl,
      customizations: {
        preparationTime: Number(formData.preparationTime) || 0,
      },
      isVegetarian: formData.isVegetarian,
    };

    try {
      setActionLoading(true);
      if (editingItem) {
        await MenuService.updateItem(editingItem.id, payload);
        toast.success(`"${payload.name}" updated`);
      } else {
        await MenuService.createItem(payload);
        toast.success(`"${payload.name}" added to menu`);
      }
      setShowModal(false);
      await fetchPageData(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || `Failed to ${editingItem ? 'update' : 'create'} item`);
    } finally {
      setActionLoading(false);
    }
  }, [formData, editingItem, fetchPageData]);

  // Helper to resolve image URLs
  const resolveImage = useCallback((url) => {
    return ImageUploadService.getImageUrl(url);
  }, []);

  // ─── Render ──────────────────────────────────────────────────

  const availableCount = menuItems.filter((i) => i.isAvailable).length;
  const unavailableCount = menuItems.length - availableCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Menu Items" />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Summary bar */}
        <div className="mb-4 flex flex-wrap gap-3">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
            ✓ {availableCount} Available
          </span>
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
            ✗ {unavailableCount} Unavailable
          </span>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
            Total: {menuItems.length}
          </span>
        </div>

        {/* Search / Filter / Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="flex-1 flex gap-3 items-center w-full">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchPageData()}
              className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd} disabled={actionLoading}>
              Add Item
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading menu items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Search size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Items Found</h3>
            <p className="text-gray-500 mb-6">
              {menuItems.length === 0 ? 'Add your first menu item to get started' : 'Try adjusting your search or filter'}
            </p>
            {menuItems.length === 0 && (
              <Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>
                Add First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const categoryName = categoriesData.find((c) => c.id === item.categoryId)?.name || '—';
              const imgSrc = resolveImage(item.imageUrl);
              const prepTime = item.customizations?.preparationTime ?? item.preparationTime;
              const isToggling = togglingId === item.id;

              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Image */}
                  <div className="h-40 bg-gray-200 rounded-t-lg overflow-hidden relative">
                    {imgSrc ? (
                      <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400 text-sm">No Image</span>
                      </div>
                    )}
                    {/* Availability badge overlay */}
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                      item.isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Name & price */}
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-lg text-gray-800 leading-tight">{item.name}</h3>
                      <span className="text-lg font-bold text-orange-500 whitespace-nowrap ml-2">
                        ₹{Number(item.price).toFixed(2)}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-gray-500 text-sm line-clamp-2">{item.description}</p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{categoryName}</span>
                      {item.isVegetarian && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">🌱 Veg</span>
                      )}
                      {prepTime != null && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">⏱ {prepTime}m</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        disabled={isToggling || actionLoading}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                          item.isAvailable
                            ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        } ${isToggling ? 'opacity-60 cursor-wait' : ''}`}
                        title={item.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
                      >
                        {item.isAvailable ? <EyeOff size={14} /> : <Eye size={14} />}
                        {isToggling ? '...' : (item.isAvailable ? 'Hide' : 'Show')}
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        disabled={actionLoading}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={actionLoading}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-semibold mb-2">Item Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg" />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload image</p>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP — max 5 MB</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {uploading && <p className="text-sm text-orange-500 mt-2 animate-pulse">Uploading...</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              placeholder="e.g., Paneer Tikka"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Category *</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="">Select Category</option>
                {categoriesData.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
              placeholder="Brief description"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Preparation Time (minutes)</label>
            <input
              type="number"
              min="1"
              value={formData.preparationTime}
              onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVegetarian}
                onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-semibold">🌱 Vegetarian</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-semibold">Available</span>
            </label>
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
              disabled={actionLoading || uploading}
            >
              {actionLoading ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MenuItems;
