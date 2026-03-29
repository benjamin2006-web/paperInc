import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiUpload,
  FiTool,
  FiFolder,
  FiFileText,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiBell,
  FiUsers, // Make sure this is imported
} from 'react-icons/fi';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: FiUpload, label: 'Upload Paper' },
    { path: '/admin/manage-trades', icon: FiTool, label: 'Manage Trades' },
    {
      path: '/admin/manage-categories',
      icon: FiFolder,
      label: 'Manage Categories',
    },
    { path: '/admin/manage-exams', icon: FiFileText, label: 'Manage Exams' },
    {
      path: '/admin/manage-announcements',
      icon: FiBell,
      label: 'Announcements',
    },
    { path: '/admin/manage-users', icon: FiUsers, label: 'Users & VIP' }, // Add this
  ];

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed top-4 z-50 bg-white border border-gray-200 rounded-lg p-2 shadow-md hover:bg-gray-50 transition-all duration-300 ${
          sidebarOpen ? 'left-64' : 'left-4'
        }`}
      >
        {sidebarOpen ? (
          <FiChevronLeft className='w-4 h-4 text-gray-700' />
        ) : (
          <FiChevronRight className='w-4 h-4 text-gray-700' />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className='h-16 flex items-center justify-center border-b border-gray-200'>
          <h3
            className={`font-bold text-black transition-all duration-300 ${sidebarOpen ? 'text-xl' : 'text-sm'}`}
          >
            {sidebarOpen ? 'Admin Panel' : 'AP'}
          </h3>
        </div>

        {/* Navigation Menu */}
        <nav className='flex-1 py-6'>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`}
                />
                {sidebarOpen && (
                  <span className='text-sm font-medium'>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200'>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <FiLogOut className='w-5 h-5 text-gray-500' />
            {sidebarOpen && <span className='text-sm font-medium'>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className='p-6'>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
