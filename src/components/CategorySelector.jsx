import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const CategorySelector = ({ categories, onSelectCategory, loading: parentLoading }) => {
  const [localCategories, setLocalCategories] = useState(categories);
  const [loading, setLoading] = useState(parentLoading);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  // Fetch categories function
  const fetchCategories = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    
    try {
      const response = await api.get('/categories');
      const categoriesData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      
      setLocalCategories(categoriesData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds (user won't notice)
  useEffect(() => {
    // Initial fetch
    fetchCategories(true);
    
    // Set up interval for background refresh
    intervalRef.current = setInterval(() => {
      // Refresh in background - no loading indicator
      fetchCategories(false);
    }, 30000); // 30 seconds
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update when parent categories change
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Optional: Show last update time (user can see but not intrusive)
  const getLastUpdateText = () => {
    if (!lastUpdate) return '';
    const seconds = Math.floor((new Date() - lastUpdate) / 1000);
    if (seconds < 60) return `Updated ${seconds}s ago`;
    if (seconds < 3600) return `Updated ${Math.floor(seconds / 60)}m ago`;
    return `Updated ${Math.floor(seconds / 3600)}h ago`;
  };

  // Loading spinner (smooth, no flash)
  const LoadingSpinner = () => {
    const [dots, setDots] = useState('');

    useEffect(() => {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className='text-center py-12'>
        <div className='flex flex-col items-center justify-center space-y-3'>
          <div className='w-10 h-10 border-3 border-gray-100 rounded-full animate-spin border-t-black'></div>
          <p className='text-gray-500 text-sm'>
            Loading categories{dots}
          </p>
        </div>
      </div>
    );
  };

  if (loading && localCategories.length === 0) {
    return <LoadingSpinner />;
  }

  if (!loading && localCategories.length === 0) {
    return (
      <div className='text-center py-12 animate-fadeIn'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4'>
          <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
          </svg>
        </div>
        <p className='text-gray-500'>No categories available</p>
        <p className='text-gray-400 text-sm mt-2'>
          Please contact administrator on 0792098874
        </p>
      </div>
    );
  }

  return (
    <div className='animate-fadeIn'>
      {/* Optional: Subtle last update indicator - user might not notice */}
      {lastUpdate && (
        <div className='text-right text-xs text-gray-400 mb-2'>
          {getLastUpdateText()}
        </div>
      )}
      
      <h2 className='text-2xl font-semibold text-black mb-6 text-center'>
        Select Category
      </h2>
      
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {localCategories.map((category) => (
          <button
            key={category._id || category.id}
            onClick={() => onSelectCategory(category)}
            className='group p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all text-left hover:scale-105 transform duration-200'
          >
            <div className='text-4xl mb-3'>
              {category.icon || (
                <svg className='w-12 h-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                </svg>
              )}
            </div>
            <h3 className='text-lg font-semibold text-black mb-1 group-hover:text-black transition'>
              {category.name}
            </h3>
            <p className='text-sm text-gray-500 group-hover:text-gray-600 transition'>
              {category.description || 'Click to browse papers'}
            </p>
            <div className='mt-3 text-xs text-gray-400 group-hover:text-gray-500 transition'>
              Browse papers →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
