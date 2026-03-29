import { useState } from 'react';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiPhone,
  FiUser,
  FiUserPlus,
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // ✅ Rwanda phone validation (fixed)
  const validateRwandanPhone = (phone) => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    let number = cleaned;

    // Normalize to local format (07XXXXXXXX)
    if (cleaned.startsWith('+250')) {
      number = '0' + cleaned.substring(4);
    }

    // Must start with 07
    if (!number.startsWith('07')) return false;

    // Must be exactly 10 digits
    if (number.length !== 10) return false;

    return true;
  };

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    let number = cleaned;

    // Convert +250XXXXXXXXX → 07XXXXXXXX
    if (cleaned.startsWith('+250')) {
      number = '0' + cleaned.substring(4);
    }

    return number;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    // Validate Rwanda phone number
    if (!validateRwandanPhone(formData.phone)) {
      setError(
        'Please enter a valid Rwanda phone number (07XXXXXXXX or +2507XXXXXXXX)',
      );
      return;
    }

    // Format phone number to international format
    const formattedPhone = formatPhoneNumber(formData.phone);

    setLoading(true);
    try {
      const response = await api.post('/users/register', {
        name: formData.name,
        phone: formattedPhone,
      });

      if (response.data.success) {
        localStorage.setItem('userToken', response.data.token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        navigate('/');
        alert('Registration successful! Welcome to Exam Paper Inc!');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.',
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

        {/* Register Card */}
        <div className='bg-white border border-gray-200 rounded-xl p-8 shadow-sm'>
          <div className='text-center mb-8'>
            <div className='w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4'>
              <FiUser className='w-8 h-8 text-white' />
            </div>
            <h1 className='text-2xl font-bold text-black'>Kora Account</h1>
            <p className='text-gray-600 mt-2'>Kora account muri paper inc</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Name Field */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Full Name *
              </label>
              <div className='relative'>
                <FiUser className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition disabled:bg-gray-50 disabled:text-gray-500'
                  placeholder='John Doe'
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Nimero ya telphone *
              </label>
              <div className='relative'>
                <FiPhone className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input
                  type='tel'
                  name='phone'
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition disabled:bg-gray-50 disabled:text-gray-500'
                  placeholder='07XXXXXXXX or +2507XXXXXXXX'
                />
              </div>
              <div className='mt-2'>
                <p className='text-xs text-gray-500 mb-1'>
                  Nimero yo murwanda gusa:
                </p>
                <div className='flex flex-wrap gap-2 text-xs'>
                  <span className='px-2 py-0.5 bg-gray-100 rounded'>
                    07xxxxxxxx
                  </span>
                </div>
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
              <FiUserPlus className='h-5 w-5' />
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              Usanzwe ufite account?{' '}
              <Link
                to='/login'
                className='text-black hover:underline font-medium'
              >
                Injira Hano
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
