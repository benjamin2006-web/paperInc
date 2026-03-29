import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPhone, FiArrowLeft, FiLogIn, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug mount/unmount
  useEffect(() => {
    console.log('Login page mounted');
    return () => console.log('Login page unmounted');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login for phone:', phone);
      const response = await api.post('/users/login', { phone });

      if (response.data.success) {
        localStorage.setItem('userToken', response.data.token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        navigate('/');
        alert('Login successful! Welcome back!');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 'Login failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12'>
      <div className='max-w-md w-full'>
        {/* Back Button */}
        <Link
          to='/'
          className='inline-flex items-center gap-2 text-gray-600 hover:text-black transition mb-6'
        >
          <FiArrowLeft className='w-4 h-4' />
          Back to Home
        </Link>

        {/* Login Card */}
        <div className='bg-white border border-gray-200 rounded-xl p-8 shadow-sm'>
          <div className='text-center mb-8'>
            <div className='w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4'>
              <FiPhone className='w-8 h-8 text-white' />
            </div>
            <h1 className='text-2xl font-bold text-black'>Welcome Back</h1>
            <p className='text-gray-600 mt-2'>Login with your phone number</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Phone Field */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Phone Number
              </label>
              <div className='relative'>
                <FiPhone className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input
                  type='tel'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={loading}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition disabled:bg-gray-50 disabled:text-gray-500'
                  placeholder='0792098874'
                />
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                Enter your registered phone number
              </p>
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

          {/* Register Link */}
          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              Don't have an account?{' '}
              <Link
                to='/register'
                className='text-black hover:underline font-medium'
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
