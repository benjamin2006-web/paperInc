import React, { useState, useEffect } from 'react';

const CategorySelector = ({ categories, onSelectCategory, loading }) => {
  const getCategoryIcon = (icon) => icon || '';

  // Loading component with three dots animation
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
        <div className='flex flex-col items-center justify-center space-y-4'>
          <div className='relative'>
            <div className='w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-black'></div>
          </div>
          <p className='text-gray-500 text-lg font-medium'>
            Loading categories{dots}
          </p>
          <p className='text-gray-400 text-sm'>
            Please wait while we fetch available categories...
          </p>
        </div>
      </div>
    );
  };

  // Show loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show no categories message
  if (!loading && categories.length === 0) {
    return (
      <div className='text-center py-12 animate-fadeIn'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4'>
          <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
          </svg>
        </div>
        <p className='text-gray-500 text-lg'>
          No categories available
        </p>
        <p className='text-gray-400 text-sm mt-2'>
          Please contact administrator on 0792098874
        </p>
      </div>
    );
  }

  // Show categories
  return (
    <div className='animate-fadeIn'>
      <h2 className='text-2xl font-semibold text-black mb-6 text-center'>
        Select Category
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {categories.map((category) => (
          <button
            key={category._id || category.id}
            onClick={() => onSelectCategory(category)}
            className='group p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all text-left hover:scale-105 transform duration-200'
          >
            <div className='text-4xl mb-3'>
              {getCategoryIcon(category.icon) || (
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
