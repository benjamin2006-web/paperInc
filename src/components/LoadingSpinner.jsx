import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className='min-h-[400px] flex flex-col items-center justify-center'>
      {/* Three Dots Animation */}
      <div className='flex gap-2'>
        <div
          className='w-3 h-3 bg-black rounded-full animate-bounce'
          style={{ animationDelay: '0s' }}
        ></div>
        <div
          className='w-3 h-3 bg-black rounded-full animate-bounce'
          style={{ animationDelay: '0.2s' }}
        ></div>
        <div
          className='w-3 h-3 bg-black rounded-full animate-bounce'
          style={{ animationDelay: '0.4s' }}
        ></div>
      </div>
      {/* Loading Text */}
      <p className='mt-4 text-gray-600 text-sm'>Loading...</p>
    </div>
  );
};

export default LoadingSpinner;
