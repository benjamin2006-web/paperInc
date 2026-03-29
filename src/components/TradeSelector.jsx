import React, { useEffect } from 'react';
import { FiTool, FiChevronLeft } from 'react-icons/fi';

const TradeSelector = ({ category, trades, onSelectTrade, onBack, onSkip }) => {
  const categoryTrades = trades[category?.id] || [];

  // If there are no trades, automatically skip to years
  useEffect(() => {
    if (categoryTrades.length === 0 && category) {
      onSkip();
    }
  }, [categoryTrades.length, category, onSkip]);

  if (categoryTrades.length === 0) {
    return null; // Don't render anything while auto-skipping
  }

  return (
    <div className='animate-fadeIn'>
      <button
        onClick={onBack}
        className='flex items-center gap-2 text-gray-600 hover:text-black transition mb-6'
      >
        <FiChevronLeft className='w-5 h-5' />
        Back to Categories
      </button>

      <h2 className='text-2xl font-semibold text-black mb-2'>
        {category?.name}
      </h2>

      <p className='text-gray-500 text-sm mb-4'>
        Hitamo icyiciro cyangwa komeza ujye mu myaka
      </p>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
        {categoryTrades.map((trade) => (
          <button
            key={trade.full}
            onClick={() => onSelectTrade(trade.full)}
            className='group p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all text-left'
          >
            <div className='flex items-center gap-3 mb-2'>
              <FiTool className='w-6 h-6 text-gray-500' />
              <h3 className='text-lg font-semibold text-black'>{trade.full}</h3>
            </div>
            <p className='text-sm text-gray-500'>Abbreviation: {trade.abbr}</p>
          </button>
        ))}
      </div>

      <div className='text-center'>
        <button
          onClick={onSkip}
          className='text-gray-500 hover:text-black text-sm underline'
        >
          Komeza ujye mu myaka →
        </button>
      </div>
    </div>
  );
};

export default TradeSelector;
