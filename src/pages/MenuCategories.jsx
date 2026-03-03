import { useState } from 'react';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Edit, Trash2, Grid, Image } from 'lucide-react';

const MenuCategories = () => {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Starters', description: 'Appetizers and starters', items: 12, image: 'https://via.placeholder.com/150', color: '#ef4444' },
    { id: 2, name: 'Main Course', description: 'Main dishes', items: 25, image: 'https://via.placeholder.com/150', color: '#f59e0b' },
    { id: 3, name: 'Desserts', description: 'Sweet treats', items: 15, image: 'https://via.placeholder.com/150', color: '#ec4899' },
    { id: 4, name: 'Beverages', description: 'Drinks and refreshments', items: 20, image: 'https://via.placeholder.com/150', color: '#06b6d4' },
    { id: 5, name: 'Specials', description: "Chef's special items", items: 8, image: 'https://via.placeholder.com/150', color: '#8b5cf6' },
    { id: 6, name: 'Breads', description: 'Various types of breads', items: 10, image: 'https://via.placeholder.com/150', color: '#d97706' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#ef4444'
  });

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', color: '#ef4444' });
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      setCategories(categories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, ...formData }
          : cat
      ));
    } else {
      setCategories([...categories, {
        id: Date.now(),
        ...formData,
        items: 0,
        image: 'https://via.placeholder.com/150'
      }]);
    }
    setShowModal(false);
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div
                  className="h-32 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  <Grid size={48} style={{ color: category.color }} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-sm font-semibold text-gray-700">
                        {category.items} items
                      </span>
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
              Color Theme
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-12 w-24 rounded-lg cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="input-field flex-1"
                placeholder="#ef4444"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-500 transition-colors cursor-pointer">
              <Image size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-500">Click to upload image</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
            </div>
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
