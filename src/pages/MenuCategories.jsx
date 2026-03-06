import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Edit, Trash2, Grid } from 'lucide-react';
import MenuService from '../services/menu.service';

const MenuCategories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayOrder: 1,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await MenuService.getCategories();
      setCategories(response?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', displayOrder: categories.length + 1 });
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder || 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await MenuService.deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await MenuService.updateCategory(editingCategory.id, formData);
      } else {
        await MenuService.createCategory(formData);
      }
      setShowModal(false);
      await fetchCategories();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Save failed');
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Menu Categories Management" />
      
      <div className="p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Manage Categories</h3>
            <p className="text-sm text-gray-500">Add, edit, or remove menu categories</p>
          </div>
          <Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>
            Add Category
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading categories...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(category => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="h-32 rounded-lg flex items-center justify-center bg-orange-50">
                      <Grid size={48} className="text-orange-500" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{category.name}</h3>
                      <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="bg-gray-100 px-3 py-1 rounded-full">
                          <span className="text-sm font-semibold text-gray-700">Display #{category.displayOrder || 1}</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {categories.length === 0 && (
              <div className="text-center py-16">
                <Grid size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Categories Yet</h3>
                <p className="text-gray-500 mb-6">Start by adding your first menu category</p>
                <Button variant="primary" icon={<Plus size={18} />} onClick={handleAdd}>
                  Add First Category
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
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
              className="input-field"
              placeholder="e.g., Starters, Main Course"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
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
              min="1"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value || 1) })}
              className="input-field"
              placeholder="1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {editingCategory ? 'Update' : 'Add'} Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MenuCategories;
