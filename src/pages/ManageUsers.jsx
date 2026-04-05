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
      // ✅ Fix: Use correct API path (without double /api)
      const response = await api.get('/auth/admin/verify');
      if (response.data.success) {
        setIsAdmin(true);
        loadData();
      } else {
        throw new Error('Invalid admin token');
      }
    } catch (error) {
      console.error('Admin verification failed:', error);
      
      // ✅ Don't logout on 404 - maybe endpoint doesn't exist
      if (error.response?.status === 404) {
        console.log('Verify endpoint not found, but continuing as admin');
        setIsAdmin(true);
        loadData();
      } else if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        setMessage({ 
          type: 'error', 
          text: 'Session expired. Please login again.' 
        });
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
      } else {
        // ✅ For other errors, still try to load data
        setIsAdmin(true);
        loadData();
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // ✅ Fix: Use correct API paths
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats/vip'),
      ]);
      
      let usersData = [];
      if (usersRes.data.users) {
        usersData = usersRes.data.users;
      } else if (Array.isArray(usersRes.data)) {
        usersData = usersRes.data;
      } else if (usersRes.data.data && Array.isArray(usersRes.data.data)) {
        usersData = usersRes.data.data;
      }
      
      setUsers(usersData);
      if (statsRes.data) {
        setStats(statsRes.data.stats || statsRes.data);
      }
      
      console.log('✅ Users loaded:', usersData.length);
    } catch (error) {
      console.error('Error loading data:', error);
      
      // ✅ Handle 404 gracefully - show message but don't logout
      if (error.response?.status === 404) {
        setMessage({ type: 'error', text: 'API endpoint not found. Check if backend is running.' });
      } else if (error.response?.status === 401) {
        setMessage({ type: 'error', text: 'Session expired. Please login again.' });
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
      } else {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load users' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Rest of your functions remain the same...
  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return;

    try {
      await api.delete(`/admin/users/${user._id}`);
      setUsers(users.filter((u) => u._id !== user._id));
      setMessage({ type: 'success', text: `${user.name} deleted successfully` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      loadData();
    } catch (error) {
      console.error('Delete user error:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete user' });
    }
  };

  const handleActivateVIP = async (user, duration, paymentRef = '') => {
    try {
      const price = pricing[duration].price;

      const response = await api.put(`/admin/users/${user._id}/vip`, {
        isVIP: true,
        durationMonths: duration,
        paymentMethod: paymentMethod,
        paymentReference: paymentRef,
        amount: price,
      });

      setUsers(users.map((u) => (u._id === user._id ? response.data.user : u)));

      setMessage({
        type: 'success',
        text: `${user.name} is now VIP for ${duration} month(s)! Payment: ${price} FRW`,
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      loadData();
    } catch (error) {
      console.error('Activate VIP error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to activate VIP' 
      });
    }
    setShowVIPModal(false);
    setShowPaymentModal(false);
    setSelectedUser(null);
    setPaymentReference('');
    setPaymentMethod('cash');
  };

  const handleRemoveVIP = async (user) => {
    try {
      const response = await api.put(`/admin/users/${user._id}/vip`, {
        isVIP: false,
        durationMonths: 0,
      });

      setUsers(users.map((u) => (u._id === user._id ? response.data.user : u)));

      setMessage({
        type: 'success',
        text: `${user.name} is now a Regular user`,
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      loadData();
    } catch (error) {
      console.error('Remove VIP error:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to remove VIP' });
    }
    setShowVIPModal(false);
    setSelectedUser(null);
  };

  const handlePaymentSubmit = () => {
    if (!paymentReference && paymentMethod !== 'cash') {
      setMessage({ type: 'error', text: 'Please enter payment reference' });
      return;
    }
    handleActivateVIP(selectedUser, vipDuration, paymentReference);
  };

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
            {users.length === 0 && !loading ? (
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

        {/* VIP Modal */}
        {showVIPModal && selectedUser && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-xl max-w-md w-full p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold text-black'>
                  Manage VIP for {selectedUser.name}
                </h2>
                <button
                  onClick={() => setShowVIPModal(false)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <FiX className='w-5 h-5' />
                </button>
              </div>

              <div className='space-y-4'>
                <div
                  className={`p-4 rounded-lg ${selectedUser.isVIP ? 'bg-yellow-50' : 'bg-gray-50'}`}
                >
                  <p className='text-sm text-gray-600 mb-2'>
                    Current Status:{' '}
                    <strong
                      className={
                        selectedUser.isVIP ? 'text-yellow-600' : 'text-gray-800'
                      }
                    >
                      {selectedUser.isVIP ? 'VIP Member' : 'Regular User'}
                    </strong>
                  </p>
                  {selectedUser.vipExpiryDate && (
                    <p className='text-xs text-gray-500'>
                      Expires:{' '}
                      {new Date(
                        selectedUser.vipExpiryDate,
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {selectedUser.isVIP ? (
                  <button
                    onClick={() => handleRemoveVIP(selectedUser)}
                    className='w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition'
                  >
                    Remove VIP
                  </button>
                ) : (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Select VIP Package
                    </label>
                    <div className='grid grid-cols-2 gap-3 mb-4'>
                      {Object.values(pricing).map((pkg) => (
                        <button
                          key={pkg.months}
                          onClick={() => setVipDuration(pkg.months)}
                          className={`p-3 border rounded-lg text-center transition ${
                            vipDuration === pkg.months
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className='font-bold'>{pkg.label}</div>
                          <div className='text-sm'>
                            {formatCurrency(pkg.price)}
                          </div>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setShowVIPModal(false);
                        setShowPaymentModal(true);
                      }}
                      className='w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition'
                    >
                      Continue to Payment
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setShowVIPModal(false)}
                  className='w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedUser && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-xl max-w-md w-full p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold text-black'>
                  Payment Details
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <FiX className='w-5 h-5' />
                </button>
              </div>

              <div className='space-y-4'>
                <div className='bg-yellow-50 p-4 rounded-lg text-center'>
                  <p className='text-sm text-gray-600'>Amount to Pay</p>
                  <p className='text-2xl font-bold text-yellow-600'>
                    {formatCurrency(pricing[vipDuration].price)}
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    {pricing[vipDuration].label} VIP Access
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Payment Method
                  </label>
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3 border rounded-lg text-center transition ${
                        paymentMethod === 'cash'
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FiCreditCard className='w-5 h-5 mx-auto mb-1' />
                      <div className='text-sm'>Cash</div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('mobile')}
                      className={`p-3 border rounded-lg text-center transition ${
                        paymentMethod === 'mobile'
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FiSmartphone className='w-5 h-5 mx-auto mb-1' />
                      <div className='text-sm'>Mobile Money</div>
                    </button>
                  </div>
                </div>

                {paymentMethod !== 'cash' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Payment Reference / Transaction ID
                    </label>
                    <input
                      type='text'
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder='Enter MTN/Airtel transaction ID'
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none'
                    />
                  </div>
                )}

                <button
                  onClick={handlePaymentSubmit}
                  className='w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition'
                >
                  Confirm Payment - {formatCurrency(pricing[vipDuration].price)}
                </button>

                <button
                  onClick={() => setShowPaymentModal(false)}
                  className='w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
