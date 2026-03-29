import React from 'react';

const SkeletonCard = () => {
  return (
    <div className='bg-white border border-gray-200 rounded-xl p-5 animate-pulse'>
      <div className='flex items-start gap-4'>
        <div className='flex-shrink-0'>
          <div className='w-12 h-12 bg-gray-200 rounded-lg'></div>
        </div>
        <div className='flex-1'>
          <div className='h-5 bg-gray-200 rounded-lg w-3/4 mb-3'></div>
          <div className='flex gap-2'>
            <div className='h-6 bg-gray-200 rounded-full w-16'></div>
            <div className='h-6 bg-gray-200 rounded-full w-20'></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
