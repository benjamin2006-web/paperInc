import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiCheckCircle,
  FiFolder,
} from 'react-icons/fi';
import api from '../services/api';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📁' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategoriesFromDatabase();
  }, []);

  // Load categories from database
  const loadCategoriesFromDatabase = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load categories from database. Please try again.',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Save categories to database
  const saveCategoriesToDatabase = async (updatedCategories) => {
    setSaving(true);
    try {
      await api.post('/categories', updatedCategories);
      return true;
    } catch (error) {
      console.error('Error saving categories:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategory = async (categoryId) => {
    const updatedCategories = categories.map((cat) =>
      cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat,
    );

    try {
      await saveCategoriesToDatabase(updatedCategories);
      setCategories(updatedCategories);
      setMessage({ type: 'success', text: 'Category updated!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to update category. Please try again.',
      });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a category name' });
      return;
    }

    const categoryId = newCategory.name.toUpperCase().replace(/\s+/g, '_');
    if (categories.find((c) => c.id === categoryId)) {
      setMessage({ type: 'error', text: 'Category already exists!' });
      return;
    }

    const updatedCategories = [
      ...categories,
      {
        id: categoryId,
        name: newCategory.name,
        icon: newCategory.icon,
        enabled: true,
      },
    ];

    try {
      await saveCategoriesToDatabase(updatedCategories);
      setCategories(updatedCategories);
      setNewCategory({ name: '', icon: '📁' });
      setMessage({ type: 'success', text: 'Category added successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to add category. Please try again.',
      });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleRemoveCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to remove this category?')) return;

    const updatedCategories = categories.filter((cat) => cat.id !== categoryId);

    try {
      await saveCategoriesToDatabase(updatedCategories);
      setCategories(updatedCategories);
      setMessage({ type: 'success', text: 'Category removed!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to remove category. Please try again.',
      });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-black mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <div className='max-w-6xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-black mb-2'>
              Manage Categories
            </h1>
            <p className='text-gray-600'>
              Add, remove, and manage exam categories
            </p>
          </div>
          {saving && (
            <div className='flex items-center gap-2 text-sm text-gray-500'>
              <div className='w-4 h-4 border-2 border-gray-300 rounded-full animate-spin border-t-black'></div>
              Saving...
            </div>
          )}
        </div>

        {/* Message Alerts */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <FiCheckCircle className='w-5 h-5 flex-shrink-0' />
            ) : (
              <FiAlertCircle className='w-5 h-5 flex-shrink-0' />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Main Container */}
        <div className='border border-gray-200 rounded-xl p-6'>
          {/* Add Category Section */}
          <div className='mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200'>
            <h3 className='text-lg font-semibold text-black mb-4 flex items-center gap-2'>
              <FiPlus className='w-5 h-5' />
              Add New Category
            </h3>
            <div className='flex flex-col sm:flex-row gap-3'>
              <input
                type='text'
                placeholder='Category name...'
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition'
              />
              <input
                type='text'
                placeholder='Icon (emoji)'
                value={newCategory.icon}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, icon: e.target.value })
                }
                maxLength='2'
                className='w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition text-center text-xl'
              />
              <button
                onClick={handleAddCategory}
                disabled={saving}
                className='flex items-center justify-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <FiPlus className='w-4 h-4' />
                Add Category
              </button>
            </div>
          </div>

          {/* Categories List Section */}
          <div>
            <h3 className='text-lg font-semibold text-black mb-4 flex items-center gap-2'>
              <FiFolder className='w-5 h-5' />
              Existing Categories ({categories.length})
            </h3>

            {categories.length === 0 ? (
              <div className='text-center py-12 border-2 border-dashed border-gray-200 rounded-lg'>
                <FiFolder className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>
                  No categories found. Add some categories!
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`group flex items-center gap-4 p-4 bg-white border rounded-xl transition-all duration-200 ${
                      !category.enabled
                        ? 'border-gray-200 opacity-60 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {/* Icon */}
                    <div className='flex-shrink-0'>
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          !category.enabled ? 'bg-gray-100' : 'bg-gray-100'
                        }`}
                      >
                        {category.icon}
                      </div>
                    </div>

                    {/* Info */}
                    <div className='flex-1'>
                      <h4 className='font-semibold text-gray-900'>
                        {category.name}
                      </h4>
                      <span className='text-xs text-gray-500 font-mono'>
                        {category.id}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => handleToggleCategory(category.id)}
                        disabled={saving}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          category.enabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        <FiCheck className='w-3 h-3' />
                        {category.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => handleRemoveCategory(category.id)}
                        disabled={saving}
                        className='p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50'
                        title='Remove category'
                      >
                        <FiX className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCategories;
