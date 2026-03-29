import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Updated: Use /auth/admin/login instead of /auth/login
      const response = await api.post('/auth/admin/login', { email, password });
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminData', JSON.stringify(response.data.admin));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-white px-4'>
      <div className='max-w-md w-full'>
        {/* Logo/Header */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4'>
            <span className='text-2xl text-white'>BEN</span>
          </div>
          <h2 className='text-3xl font-bold text-black'>Admin Login</h2>
          <p className='text-gray-600 mt-2'>Access the exam papers dashboard</p>
        </div>

        {/* Login Card */}
        <div className='border border-gray-200 rounded-xl p-8'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Email Field */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Email Address
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <FiMail className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition disabled:bg-gray-50 disabled:text-gray-500'
                  placeholder='admin@example.com'
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Password
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <FiLock className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition disabled:bg-gray-50 disabled:text-gray-500'
                  placeholder='••••••••'
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800'>
                <FiAlertCircle className='h-5 w-5 flex-shrink-0' />
                <span className='text-sm'>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type='submit'
              disabled={loading}
              className='w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <FiLogIn className='h-5 w-5' />
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Footer */}
          <div className='mt-6 text-center'>
            <p className='text-xs text-gray-500'>Secure admin access only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
