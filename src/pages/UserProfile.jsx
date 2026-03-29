import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiLoader,
  FiPhone,
  FiStar,
  FiUser,
  FiXCircle,
  FiInfo,
  FiArrowLeft,
} from 'react-icons/fi';
import UserLayout from '../components/UserLayout';
import api from '../services/api';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Pricing in FRW (for information only)
  const packages = [
    { months: 1, price: 500, label: 'Ukwezi 1' },
    { months: 3, price: 1200, label: 'Amezi 3' },
    { months: 6, price: 2000, label: 'Amezi 6' },
    { months: 12, price: 3500, label: 'Umwaka 1' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    loadUserProfile();
    loadPaymentHistory();
  }, [navigate]);

  const loadUserProfile = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const response = await api.get('/users/me/payments');
      setPaymentHistory(response.data.payments || []);
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const getVIPStatus = () => {
    if (!user)
      return {
        status: 'Ubuntu',
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        icon: FiXCircle,
        message: 'Uri kuri gahunda yubuntu',
      };
    if (!user.isVIP)
      return {
        status: 'Ubuntu',
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        icon: FiXCircle,
        message: 'Uri kuri gahunda yubuntu',
      };
    if (user.vipExpiryDate && new Date(user.vipExpiryDate) < new Date()) {
      return {
        status: 'VIP Yarangiye',
        color: 'text-red-600',
        bg: 'bg-red-50',
        icon: FiClock,
        message: 'VIP yawe yarangiye, ishyura uhindure',
      };
    }
    return {
      status: 'VIP Ikora',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      icon: FiCheckCircle,
      message: 'Ufite uburenganzira bwose bwa VIP',
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('rw-RW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const daysRemaining = () => {
    if (!user?.vipExpiryDate) return 0;
    const expiry = new Date(user.vipExpiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const vipStatus = getVIPStatus();
  const StatusIcon = vipStatus.icon;

  // Handle back navigation
  const handleGoBack = () => {
    navigate(-1);
  };

  // Content component that will be rendered inside UserLayout
  const ProfileContent = () => {
    if (loading) {
      return (
        <div className='min-h-[400px] flex items-center justify-center'>
          <div className='text-center'>
            <FiLoader className='w-12 h-12 animate-spin text-gray-400 mx-auto' />
            <p className='mt-4 text-gray-600'>Ibiro birimo gukoresha...</p>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-gray-50 py-8'>
        <div className='max-w-4xl mx-auto px-4'>
          {/* Back Button */}
          <button
            onClick={handleGoBack}
            className='inline-flex items-center gap-2 text-gray-600 hover:text-black transition mb-6'
          >
            <FiArrowLeft className='w-5 h-5' />
            <span>Subira inyuma</span>
          </button>

          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-black'>Konti Yanjye</h1>
            <p className='text-gray-600 mt-1'>
              Reba amakuru yawe n'uburyo bwa VIP
            </p>
          </div>

          {/* User Info Card */}
          <div className='bg-white rounded-xl border border-gray-200 p-6 mb-6'>
            <div className='flex items-start gap-4'>
              <div className='w-16 h-16 bg-black rounded-full flex items-center justify-center'>
                <FiUser className='w-8 h-8 text-white' />
              </div>
              <div className='flex-1'>
                <h2 className='text-2xl font-bold text-black'>{user?.name}</h2>
                <p className='text-gray-600 flex items-center gap-2 mt-1'>
                  <FiPhone className='w-4 h-4' />
                  {user?.phone}
                </p>
                <p className='text-sm text-gray-500 mt-2'>
                  Uyoboye kuva {formatDate(user?.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* VIP Status Card */}
          <div
            className={`rounded-xl border p-6 mb-6 ${vipStatus.bg} border-${vipStatus.color === 'text-yellow-600' ? 'yellow-200' : 'gray-200'}`}
          >
            <div className='flex items-center justify-between flex-wrap gap-4'>
              <div className='flex items-center gap-3'>
                <StatusIcon className={`w-8 h-8 ${vipStatus.color}`} />
                <div>
                  <h3 className='text-lg font-semibold text-black'>
                    Amakuru ya VIP
                  </h3>
                  <p className={`text-2xl font-bold ${vipStatus.color}`}>
                    {vipStatus.status}
                  </p>
                  <p className='text-sm text-gray-600 mt-1'>
                    {vipStatus.message}
                  </p>
                </div>
              </div>

              {user?.isVIP &&
                user?.vipExpiryDate &&
                new Date(user.vipExpiryDate) > new Date() && (
                  <div className='text-right'>
                    <p className='text-sm text-gray-600'>VIP izashira mu</p>
                    <p className='text-2xl font-bold text-yellow-600'>
                      {daysRemaining()} iminsi
                    </p>
                    <p className='text-xs text-gray-500'>
                      kugeza {formatDate(user.vipExpiryDate)}
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* VIP Benefits */}
          <div className='bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6 mb-6'>
            <div className='flex items-center gap-2 mb-4'>
              <FiStar className='w-6 h-6 text-yellow-600' />
              <h3 className='text-lg font-semibold text-black'>
                Inyungu za VIP
              </h3>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div className='flex items-center gap-2 text-sm text-gray-700'>
                <FiCheckCircle className='w-4 h-4 text-green-500' />
                Ubona ibizamini byose byashize
              </div>
              <div className='flex items-center gap-2 text-sm text-gray-700'>
                <FiCheckCircle className='w-4 h-4 text-green-500' />
                Urakura impapuro zose udasohotse
              </div>
              <div className='flex items-center gap-2 text-sm text-gray-700'>
                <FiCheckCircle className='w-4 h-4 text-green-500' />
                Ubona ibikoresho byo kwiga byose
              </div>
              <div className='flex items-center gap-2 text-sm text-gray-700'>
                <FiCheckCircle className='w-4 h-4 text-green-500' />
                Ubona amakuru mashya mbere ya bose
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className='bg-white rounded-xl border border-gray-200 p-6 mb-6'>
            <div className='flex items-center gap-2 mb-4'>
              <FiDollarSign className='w-6 h-6 text-gray-600' />
              <h3 className='text-lg font-semibold text-black'>
                Igiciro cya VIP
              </h3>
            </div>
            <p className='text-sm text-gray-600 mb-4'>
              Hamagara 0792098874 bagufungurire VIP mode
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              {packages.map((pkg) => (
                <div
                  key={pkg.months}
                  className='p-4 border border-gray-200 rounded-xl text-center bg-gray-50'
                >
                  <div className='text-2xl font-bold text-black'>
                    {pkg.label}
                  </div>
                  <div className='text-2xl font-bold text-yellow-600 mt-2'>
                    {formatCurrency(pkg.price)}
                  </div>
                  <div className='text-xs text-gray-500 mt-2'>
                    {pkg.months === 1
                      ? 'Igenzura'
                      : pkg.months === 12
                        ? 'Igiciro cyiza'
                        : 'Gikunzwe'}
                  </div>
                </div>
              ))}
            </div>
            <div className='mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2'>
              <FiInfo className='w-5 h-5 text-blue-600' />
              <p className='text-sm text-blue-700'>
                Ishyura kuri MoMo Pay 1766265 cyangwa 0792098874 muri Paper Inc
                bakakwemerera gukoresha VIP
              </p>
            </div>
          </div>

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className='bg-white rounded-xl border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-black mb-4 flex items-center gap-2'>
                <FiDollarSign className='w-5 h-5 text-gray-600' />
                Historic yo Kwishyura
              </h3>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='border-b border-gray-200'>
                    <tr>
                      <th className='text-left py-3 text-sm font-medium text-gray-600'>
                        Itariki
                      </th>
                      <th className='text-left py-3 text-sm font-medium text-gray-600'>
                        Amafaranga
                      </th>
                      <th className='text-left py-3 text-sm font-medium text-gray-600'>
                        Igihe
                      </th>
                      <th className='text-left py-3 text-sm font-medium text-gray-600'>
                        Uburyo
                      </th>
                      <th className='text-left py-3 text-sm font-medium text-gray-600'>
                        Referansi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment, index) => (
                      <tr key={index} className='border-b border-gray-100'>
                        <td className='py-3 text-sm text-gray-700'>
                          {formatDate(payment.date)}
                        </td>
                        <td className='py-3 text-sm font-medium text-gray-900'>
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className='py-3 text-sm text-gray-700'>
                          {payment.duration} amezi
                        </td>
                        <td className='py-3 text-sm text-gray-700 capitalize'>
                          {payment.method === 'mobile'
                            ? 'MoMo'
                            : payment.method === 'cash'
                              ? 'Amafaranga'
                              : payment.method}
                        </td>
                        <td className='py-3 text-sm text-gray-500'>
                          {payment.reference || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Payment History Message */}
          {paymentHistory.length === 0 && (
            <div className='bg-white rounded-xl border border-gray-200 p-6 text-center'>
              <FiDollarSign className='w-12 h-12 text-gray-400 mx-auto mb-3' />
              <p className='text-gray-500'>Nta historic yo kwishyura aboneka</p>
              <p className='text-sm text-gray-400 mt-1'>
                Amakuru yo kwishyura azagaragara hano iyo uba VIP
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <UserLayout onSearch={() => {}}>
      <ProfileContent />
    </UserLayout>
  );
};

export default UserProfile;
