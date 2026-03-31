import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiStar,
  FiDollarSign,
  FiTrash2,
  FiCheck,
  FiX,
  FiLoader,
  FiRefreshCw,
  FiAward,
  FiCreditCard,
  FiSmartphone,
  FiAlertCircle,
  FiUserPlus,
} from 'react-icons/fi';
import api from '../services/api';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [vipDuration, setVipDuration] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isAdmin, setIsAdmin] = useState(false);

  const pricing = {
    1: { months: 1, price: 500, label: '1 Month' },
    3: { months: 3, price: 1200, label: '3 Months' },
    6: { months: 6, price: 2000, label: '6 Months' },
    12: { months: 12, price: 3500, label: '12 Months' },
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const adminToken = localStorage.getItem('adminToken');
    
    if (!adminToken) {
      setMessage({ 
        type: 'error', 
        text: 'Admin access required. Please login as admin.' 
      });
      setLoading(false);
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 2000);
      return;
    }
    
    try {
      const response = await api.get('/api/auth/admin/verify');
      if (response.data.success) {
        setIsAdmin(true);
        loadData();
      } else {
        throw new Error('Invalid admin token');
      }
    } catch (error) {
      console.error('Admin verification failed:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      setMessage({ 
        type: 'error', 
        text: 'Session expired. Please login again.' 
      });
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 2000);
    }
  };

  const loadData = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/stats/vip'),
      ]);
      
      // ✅ Handle different response structures
      let usersData = [];
      if (usersRes.data.users) {
        usersData = usersRes.data.users;
      } else if (Array.isArray(usersRes.data)) {
        usersData = usersRes.data;
      } else if (usersRes.data.data && Array.isArray(usersRes.data.data)) {
        usersData = usersRes.data.data;
      }
      
      setUsers(usersData);
      setStats(statsRes.data.stats || statsRes.data);
      
      console.log('✅ Users loaded:', usersData.length);
    } catch (error) {
      console.error('Error loading data:', error);
      
      if (error.response?.status === 401) {
        setMessage({ type: 'error', text: 'Session expired. Please login again.' });
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
      } else if (error.response?.status === 404) {
        setMessage({ type: 'error', text: 'API endpoint not found. Check backend routes.' });
      } else {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load users' });
      }
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the functions (handleActivateVIP, handleRemoveVIP, etc.) remain the same ...

  const getVIPStatus = (user) => {
    if (!user.isVIP)
      return { status: 'Regular', color: 'text-gray-500', bg: 'bg-gray-100' };
    if (user.vipExpiryDate && new Date(user.vipExpiryDate) < new Date()) {
      return { status: 'Expired', color: 'text-red-600', bg: 'bg-red-50' };
    }
    return {
      status: 'Active VIP',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && !isAdmin) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <FiLoader className='w-12 h-12 animate-spin text-gray-400 mx-auto' />
          <p className='mt-4 text-gray-600'>Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && !loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4'>
            <FiAlertCircle className='w-8 h-8 text-red-500' />
          </div>
          <h2 className='text-xl font-semibold text-black mb-2'>Access Denied</h2>
          <p className='text-gray-600 mb-4'>
            You need admin privileges to access this page.
          </p>
          <button
            onClick={() => window.location.href = '/admin/login'}
            className='px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition'
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-black mb-2'>Manage Users</h1>
            <p className='text-gray-600'>
              Manage user accounts and VIP subscriptions
            </p>
          </div>
          <button
            onClick={loadData}
            className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'
          >
            <FiRefreshCw className='w-4 h-4' />
            Refresh
          </button>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <FiCheck className='w-5 h-5' />
            ) : (
              <FiX className='w-5 h-5' />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center gap-3'>
                <FiUsers className='w-8 h-8 text-gray-600' />
                <div>
                  <p className='text-2xl font-bold text-black'>
                    {stats.totalUsers || users.length}
                  </p>
                  <p className='text-sm text-gray-600'>Total Users</p>
                </div>
              </div>
            </div>
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center gap-3'>
                <FiStar className='w-8 h-8 text-yellow-500' />
                <div>
                  <p className='text-2xl font-bold text-black'>
                    {stats.vipUsers || users.filter(u => u.isVIP).length}
                  </p>
                  <p className='text-sm text-gray-600'>VIP Users</p>
                </div>
              </div>
            </div>
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center gap-3'>
                <FiAward className='w-8 h-8 text-green-500' />
                <div>
                  <p className='text-2xl font-bold text-black'>
                    {stats.activeVIP || users.filter(u => u.isVIP && u.vipExpiryDate && new Date(u.vipExpiryDate) > new Date()).length}
                  </p>
                  <p className='text-sm text-gray-600'>Active VIP</p>
                </div>
              </div>
            </div>
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center gap-3'>
                <FiDollarSign className='w-8 h-8 text-green-600' />
                <div>
                  <p className='text-2xl font-bold text-black'>
                    {formatCurrency(stats.totalRevenue || 0)}
                  </p>
                  <p className='text-sm text-gray-600'>Total Revenue</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className='border border-gray-200 rounded-xl overflow-hidden'>
          <div className='overflow-x-auto'>
            {users.length === 0 ? (
              <div className='text-center py-16'>
                <div className='inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4'>
                  <FiUserPlus className='w-10 h-10 text-gray-400' />
                </div>
                <h3 className='text-lg font-medium text-gray-900 mb-2'>No Users Yet</h3>
                <p className='text-gray-500 mb-4'>
                  No users have registered yet. Users will appear here when they sign up.
                </p>
                <p className='text-sm text-gray-400'>
                  Users can register using their phone number via the login page.
                </p>
              </div>
            ) : (
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Name</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Phone</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Status</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>VIP Expiry</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Joined</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {users.map((user) => {
                    const vipStatus = getVIPStatus(user);
                    return (
                      <tr key={user._id} className='hover:bg-gray-50 transition'>
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium text-gray-900'>
                              {user.name}
                            </span>
                            {user.isVIP &&
                              user.vipExpiryDate &&
                              new Date(user.vipExpiryDate) > new Date() && (
                                <FiStar className='w-4 h-4 text-yellow-500' />
                              )}
                          </div>
                        </td>
                        <td className='px-6 py-4 text-sm text-gray-600'>
                          {user.phone}
                        </td>
                        <td className='px-6 py-4'>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vipStatus.bg} ${vipStatus.color}`}
                          >
                            {vipStatus.status}
                          </span>
                        </td>
                        <td className='px-6 py-4 text-sm text-gray-600'>
                          {user.vipExpiryDate
                            ? new Date(user.vipExpiryDate).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className='px-6 py-4 text-sm text-gray-600'>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex gap-2'>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowVIPModal(true);
                              }}
                              className='p-1 text-blue-600 hover:text-blue-800 transition'
                              title='Manage VIP'
                            >
                              <FiStar className='w-5 h-5' />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className='p-1 text-red-600 hover:text-red-800 transition'
                              title='Delete User'
                            >
                              <FiTrash2 className='w-5 h-5' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
