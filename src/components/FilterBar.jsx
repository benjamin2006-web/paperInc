import React, { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

const FilterBar = ({ filters, onFilterChange, options }) => {
  const [showTradeDropdown, setShowTradeDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const years = Array.from(
    { length: new Date().getFullYear() - 2000 + 1 },
    (_, i) => 2000 + i,
  ).reverse();

  const handleCategoryChange = (category) => {
    onFilterChange({ ...filters, category, trade: '' });
    setSelectedTrade('');
  };

  const handleTradeSelect = (trade) => {
    setSelectedTrade(trade);
    onFilterChange({ ...filters, trade });
    setShowTradeDropdown(false);
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    onFilterChange({ ...filters, year });
    setShowYearDropdown(false);
  };

  const clearFilters = () => {
    setSelectedTrade('');
    setSelectedYear('');
    onFilterChange({ category: '', trade: '', year: '' });
  };

  const hasActiveFilters = filters.category || filters.trade || filters.year;

  return (
    <div className='bg-white border border-gray-200 rounded-xl p-6'>
      <div className='flex flex-wrap items-end gap-4'>
        {/* Category Filter */}
        <div className='flex-1 min-w-[180px]'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition'
          >
            <option value=''>All Categories</option>
            {options.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Trade Filter - Only for TVET */}
        {(filters.category === 'L5 TVET' ||
          filters.category === 'S6 ANP' ||
          filters.category === 'S6 GE' ||
          filters.category === 'Y3 TTC') && (
          <div className='flex-1 min-w-[180px] relative'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Trade
            </label>
            <button
              type='button'
              onClick={() => setShowTradeDropdown(!showTradeDropdown)}
              className='w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition bg-white'
            >
              <span
                className={selectedTrade ? 'text-gray-900' : 'text-gray-500'}
              >
                {selectedTrade || 'All Trades'}
              </span>
              {showTradeDropdown ? (
                <FiChevronDown className='w-5 h-5 text-gray-500' />
              ) : (
                <FiChevronRight className='w-5 h-5 text-gray-500' />
              )}
            </button>

            {showTradeDropdown && (
              <div className='absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto'>
                <button
                  onClick={() => handleTradeSelect('')}
                  className='w-full text-left px-4 py-2 hover:bg-gray-50 transition text-gray-500'
                >
                  All Trades
                </button>
                {options.trades.map((trade) => (
                  <button
                    key={trade}
                    onClick={() => handleTradeSelect(trade)}
                    className='w-full text-left px-4 py-2 hover:bg-gray-50 transition'
                  >
                    {trade}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Year Filter */}
        <div className='flex-1 min-w-[180px] relative'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Year
          </label>
          <button
            type='button'
            onClick={() => setShowYearDropdown(!showYearDropdown)}
            className='w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition bg-white'
          >
            <span className={selectedYear ? 'text-gray-900' : 'text-gray-500'}>
              {selectedYear || 'All Years'}
            </span>
            {showYearDropdown ? (
              <FiChevronDown className='w-5 h-5 text-gray-500' />
            ) : (
              <FiChevronRight className='w-5 h-5 text-gray-500' />
            )}
          </button>

          {showYearDropdown && (
            <div className='absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto'>
              <button
                onClick={() => handleYearSelect('')}
                className='w-full text-left px-4 py-2 hover:bg-gray-50 transition text-gray-500'
              >
                All Years
              </button>
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className='w-full text-left px-4 py-2 hover:bg-gray-50 transition'
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className='flex items-center'>
            <button
              onClick={clearFilters}
              className='px-4 py-2 text-sm text-gray-600 hover:text-black transition border border-gray-300 rounded-lg hover:border-gray-400'
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
