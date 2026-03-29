import React from 'react';

const CategorySelector = ({ categories, onSelectCategory }) => {
  const getCategoryIcon = (icon) => icon || '';

  if (categories.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>
          No categories available. Please contact administrator on 0792098874.
        </p>
      </div>
    );
  }

  return (
    <div className='animate-fadeIn'>
      <h2 className='text-2xl font-semibold text-black mb-6 text-center'>
        Select Category
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category)}
            className='group p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all text-left'
          >
            <div className='text-4xl mb-3'>
              {getCategoryIcon(category.icon)}
            </div>
            <h3 className='text-lg font-semibold text-black mb-1'>
              {category.name}
            </h3>
            <p className='text-sm text-gray-500'>Click to browse papers</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
