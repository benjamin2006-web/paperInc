import React from 'react';
import { FiCalendar, FiChevronLeft } from 'react-icons/fi';

const YearSelector = ({
  category,
  selectedTrade,
  availableYears,
  onSelectYear,
  onBack,
  onReset,
}) => {
  if (availableYears.length === 0) {
    return (
      <div className='animate-fadeIn'>
        <button
          onClick={onBack}
          className='flex items-center gap-2 text-gray-600 hover:text-black transition mb-6'
        >
          <FiChevronLeft className='w-5 h-5' />
          Back
        </button>

        <div className='text-center py-12'>
          <p className='text-gray-500'>Nta nyandiko zihari muri uyu mwaka</p>
          <button
            onClick={onReset}
            className='mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition'
          >
            Tangira Urundi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='animate-fadeIn'>
      <button
        onClick={onBack}
        className='flex items-center gap-2 text-gray-600 hover:text-black transition mb-6'
      >
        <FiChevronLeft className='w-5 h-5' />
        Back
      </button>

      <h2 className='text-2xl font-semibold text-black mb-2'>
        {category?.name}
      </h2>

      {selectedTrade && (
        <p className='text-gray-600 mb-4'>
          Icyiciro: <span className='font-medium'>{selectedTrade}</span>
        </p>
      )}

      <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
        {availableYears.map((year) => (
          <button
            key={year}
            onClick={() => onSelectYear(year)}
            className='p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all text-center'
          >
            <FiCalendar className='w-6 h-6 mx-auto mb-2 text-gray-500' />
            <span className='text-lg font-semibold text-black'>{year}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default YearSelector;
