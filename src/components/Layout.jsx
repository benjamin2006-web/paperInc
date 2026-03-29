import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiLock, FiMenu, FiX } from 'react-icons/fi';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = localStorage.getItem('adminToken');

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <div className='min-h-screen bg-white'>
      {/* Navigation Bar */}
      <nav className='bg-white border-b border-gray-200 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo */}
            <Link
              to='/'
              className='flex items-center gap-2 text-xl font-bold text-black hover:text-gray-700 transition'
            >
              <span className='text-2xl'></span>
              <span className='hidden sm:inline'>Exam Papers Archive</span>
              <span className='sm:hidden'>Exam Papers</span>
            </Link>

            {/* Desktop Navigation */}
            <div className='hidden md:flex items-center gap-4'>
              {isAdmin ? (
                <>
                  <Link
                    to='/admin/dashboard'
                    className='px-4 py-2 text-gray-700 hover:text-black transition border border-transparent hover:border-gray-300 rounded-lg'
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-black transition border border-transparent hover:border-gray-300 rounded-lg'
                  >
                    <FiLogOut className='w-4 h-4' />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to='/admin/login'
                  className='flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition'
                >
                  <FiLock className='w-4 h-4' />
                  Admin Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='md:hidden p-2 rounded-lg hover:bg-gray-100 transition'
            >
              {isMobileMenuOpen ? (
                <FiX className='w-6 h-6 text-gray-700' />
              ) : (
                <FiMenu className='w-6 h-6 text-gray-700' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className='md:hidden border-t border-gray-200 bg-white'>
            <div className='px-4 py-3 space-y-2'>
              {isAdmin ? (
                <>
                  <Link
                    to='/admin/dashboard'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition'
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-2'
                  >
                    <FiLogOut className='w-4 h-4' />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to='/admin/login'
                  className='block px-4 py-2 bg-black text-white rounded-lg text-center hover:bg-gray-800 transition'
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
