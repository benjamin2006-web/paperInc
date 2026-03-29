import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiX,
  FiEdit2,
  FiTrash2,
  FiAlertCircle,
  FiCheckCircle,
  FiBell,
  FiFlag,
  FiCalendar,
} from 'react-icons/fi';
import api from '../services/api';

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    showBanner: false,
    showBell: true,
    expiresAt: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/announcements/all');
      setAnnouncements(response.data.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      if (editingAnnouncement) {
        await api.put(`/announcements/${editingAnnouncement._id}`, formData);
        setMessage({
          type: 'success',
          text: 'Announcement updated successfully!',
        });
      } else {
        await api.post('/announcements', formData);
        setMessage({
          type: 'success',
          text: 'Announcement added successfully!',
        });
      }

      resetForm();
      fetchAnnouncements();

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save announcement' });
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      showBanner: announcement.showBanner,
      showBell: announcement.showBell,
      expiresAt: announcement.expiresAt
        ? announcement.expiresAt.split('T')[0]
        : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await api.delete(`/announcements/${id}`);
      setMessage({
        type: 'success',
        text: 'Announcement deleted successfully!',
      });
      fetchAnnouncements();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete announcement' });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      message: '',
      showBanner: false,
      showBell: true,
      expiresAt: '',
    });
  };

  const getExpirationStatus = (expiresAt) => {
    if (!expiresAt) return { text: 'Never', color: 'text-green-600' };
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    if (expiryDate < now) return { text: 'Expired', color: 'text-red-600' };
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    return { text: `${daysLeft} days left`, color: 'text-yellow-600' };
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-black mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading announcements...</p>
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
              Manage Announcements
            </h1>
            <p className='text-gray-600'>
              Create and manage announcements for users
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className='flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition'
          >
            <FiPlus className='w-5 h-5' />
            New Announcement
          </button>
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

        {/* Announcement Form Modal */}
        {showForm && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto'>
              <div className='p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h2 className='text-xl font-semibold text-black'>
                    {editingAnnouncement
                      ? 'Edit Announcement'
                      : 'New Announcement'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className='p-1 text-gray-400 hover:text-gray-600'
                  >
                    <FiX className='w-5 h-5' />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Title *
                    </label>
                    <input
                      type='text'
                      name='title'
                      value={formData.title}
                      onChange={handleInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none'
                      placeholder='e.g., Important Update'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Message *
                    </label>
                    <textarea
                      name='message'
                      value={formData.message}
                      onChange={handleInputChange}
                      rows='4'
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none'
                      placeholder='Enter announcement message...'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Expires At (Optional)
                    </label>
                    <input
                      type='date'
                      name='expiresAt'
                      value={formData.expiresAt}
                      onChange={handleInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                      Leave empty for no expiration
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        name='showBanner'
                        checked={formData.showBanner}
                        onChange={handleInputChange}
                        className='w-4 h-4'
                      />
                      <span className='text-sm text-gray-700'>
                        Show as banner on homepage
                      </span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        name='showBell'
                        checked={formData.showBell}
                        onChange={handleInputChange}
                        className='w-4 h-4'
                      />
                      <span className='text-sm text-gray-700'>
                        Show notification bell
                      </span>
                    </label>
                  </div>

                  <div className='flex gap-3 pt-4'>
                    <button
                      type='submit'
                      className='flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition'
                    >
                      {editingAnnouncement ? 'Update' : 'Create'} Announcement
                    </button>
                    <button
                      type='button'
                      onClick={resetForm}
                      className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Announcements List */}
        <div className='border border-gray-200 rounded-xl overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>
                    Title
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>
                    Message
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>
                    Display
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>
                    Expires
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>
                    Created
                  </th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {announcements.length === 0 ? (
                  <tr>
                    <td
                      colSpan='6'
                      className='px-6 py-12 text-center text-gray-500'
                    >
                      No announcements yet. Click "New Announcement" to create
                      one.
                    </td>
                  </tr>
                ) : (
                  announcements.map((announcement) => {
                    const expiration = getExpirationStatus(
                      announcement.expiresAt,
                    );
                    return (
                      <tr
                        key={announcement._id}
                        className='hover:bg-gray-50 transition'
                      >
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-2'>
                            <FiFlag className='w-4 h-4 text-gray-400' />
                            <span className='font-medium text-gray-900'>
                              {announcement.title}
                            </span>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <p className='text-sm text-gray-600 max-w-xs truncate'>
                            {announcement.message}
                          </p>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex gap-2'>
                            {announcement.showBanner && (
                              <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700'>
                                <FiFlag className='w-3 h-3' />
                                Banner
                              </span>
                            )}
                            {announcement.showBell && (
                              <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700'>
                                <FiBell className='w-3 h-3' />
                                Bell
                              </span>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <span className={`text-sm ${expiration.color}`}>
                            {expiration.text}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-1 text-sm text-gray-500'>
                            <FiCalendar className='w-3 h-3' />
                            {new Date(
                              announcement.createdAt,
                            ).toLocaleDateString()}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex gap-2'>
                            <button
                              onClick={() => handleEdit(announcement)}
                              className='p-1 text-gray-400 hover:text-blue-600 transition'
                              title='Edit'
                            >
                              <FiEdit2 className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() => handleDelete(announcement._id)}
                              className='p-1 text-gray-400 hover:text-red-600 transition'
                              title='Delete'
                            >
                              <FiTrash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAnnouncements;
