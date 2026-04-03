import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const CategorySelector = ({ categories, onSelectCategory, loading: parentLoading }) => {
  const [localCategories, setLocalCategories] = useState(categories);
  const [loading, setLoading] = useState(parentLoading);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // Fetch categories from API
  const fetchCategories = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/categories');
      const categoriesData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      
      setLocalCategories(categoriesData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.response?.status === 404 
        ? 'Categories endpoint not found. Please check backend API.' 
        : 'Failed to load categories. Please try again later.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchCategories(true);
    
    intervalRef.current = setInterval(() => {
      fetchCategories(false);
    }, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update when parent categories change
  useEffect(() => {
    if (categories && categories.length > 0) {
      setLocalCategories(categories);
    }
  }, [categories]);

  const getLastUpdateText = () => {
    if (!lastUpdate) return '';
    const seconds = Math.floor((new Date() - lastUpdate) / 1000);
    if (seconds < 60) return `Updated ${seconds}s ago`;
    if (seconds < 3600) return `Updated ${Math.floor(seconds / 60)}m ago`;
    return `Updated ${Math.floor(seconds / 3600)}h ago`;
  };

  // Loading spinner
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

  // Error state
  if (error && localCategories.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4'>
          <svg className='w-8 h-8 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
          </svg>
        </div>
        <p className='text-red-600 font-medium'>{error}</p>
        <button
          onClick={() => fetchCategories(true)}
          className='mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all'
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (loading && localCategories.length === 0) {
    return <LoadingSpinner />;
  }

  // Empty state
  if (!loading && localCategories.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4'>
          <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
          </svg>
        </div>
        <p className='text-gray-500'>No categories available</p>
        <button
          onClick={() => fetchCategories(true)}
          className='mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all'
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div>
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
