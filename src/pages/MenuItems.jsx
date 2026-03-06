import { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Edit, Trash2, Search, Filter, Upload, X } from 'lucide-react';
import MenuService from '../services/menu.service';
import ImageUploadService from '../services/upload.service';

const MenuItems = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
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

  const fetchPageData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        MenuService.getCategories(),
        MenuService.getItems(),
      ]);
      setCategoriesData(categoriesRes?.data || []);
      setMenuItems(itemsRes?.data || []);
    } catch (error) {
      console.error('Failed to fetch menu data:', error);
      setCategoriesData([]);
      setMenuItems([]);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

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

  const handleAdd = () => {
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
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setImagePreview(item.imageUrl);
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
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await MenuService.deleteItem(id);
      await fetchPageData();
    } catch (error) {
      alert(error?.response?.data?.message || error.message || 'Failed to delete item');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await ImageUploadService.uploadImage(file);
      setFormData({ ...formData, imageUrl });
      setImagePreview(imageUrl);
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClearImage = () => {
    setFormData({ ...formData, imageUrl: '' });
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.categoryId || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    const payload = {
      categoryId: Number(formData.categoryId),
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      isAvailable: formData.isAvailable,
      imageUrl: formData.imageUrl,
      customizations: {
        preparationTime: Number(formData.preparationTime) || 0,
      },
      isVegetarian: formData.isVegetarian,
    };

    try {
      if (editingItem) {
        await MenuService.updateItem(editingItem.id, payload);
      } else {
        await MenuService.createItem(payload);
      }
      setShowModal(false);
      await fetchPageData();
    } catch (error) {
      alert(`Failed to ${editingItem ? 'update' : 'create'} item: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <Header title="Menu Items" />

      <div className="px-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="flex-1 flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No menu items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <div className="h-40 bg-gray-200 rounded-t-lg overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-orange-500">
                      ₹{Number(item.price).toFixed(2)}
                    </span>
                    <div className="flex gap-2 text-xs">
                      {item.isVegetarian && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Veg</span>
                      )}
                      {(item.customizations?.preparationTime ?? item.preparationTime) != null && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {item.customizations?.preparationTime ?? item.preparationTime}m
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mb-3 text-xs text-gray-500">
                    {item.isAvailable ? (
                      <span className="text-green-600">● Available</span>
                    ) : (
                      <span className="text-red-600">● Unavailable</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleEdit(item)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(item.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Menu Item">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Item Image</label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-40 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload image</p>
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
            {uploading && <p className="text-sm text-orange-500 mt-2">Uploading...</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Category *</label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select Category</option>
              {categoriesData.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Price *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Preparation Time (minutes)</label>
            <input
              type="number"
              min="1"
              value={formData.preparationTime}
              onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="veg"
              checked={formData.isVegetarian}
              onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
            />
            <label htmlFor="veg" className="text-sm font-semibold">Vegetarian Item</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="available"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
            />
            <label htmlFor="available" className="text-sm font-semibold">Available</label>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MenuItems;
