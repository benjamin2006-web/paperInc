import React from 'react';
import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import PaperCard from './PaperCard';

const PapersDisplay = ({
  papers,
  category,
  selectedTrade,
  selectedYear,
  query,
  loading,
  onBack,
  onReset,
  onClear,
  isVIP = false,
}) => {
  // If this is search results view
  if (query !== undefined) {
    if (loading) {
      return (
        <div className='min-h-[400px] flex items-center justify-center'>
          <div className='text-center'>
            <div className='w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-black mx-auto'></div>
            <p className='mt-4 text-gray-600'>Searching...</p>
          </div>
        </div>
      );
    }

    return (
      <div className='animate-fadeIn'>
        <div className='mb-6'>
          <div className='flex items-center justify-between flex-wrap gap-4'>
            <div>
              <h2 className='text-2xl font-semibold text-black mb-2'>
                Search Results
              </h2>
              <p className='text-gray-600'>
                {papers?.length || 0} result(s) found
              </p>
            </div>
            <button
              onClick={onClear}
              className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'
            >
              Clear Search
            </button>
          </div>
        </div>

        {papers?.length === 0 ? (
          <div className='text-center py-12'>
            <FiSearch className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <p className='text-gray-500'>No papers found</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {papers.map((paper) => (
              <PaperCard key={paper._id} paper={paper} isVIP={isVIP} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Regular papers display
  return (
    <div className='animate-fadeIn'>
      <div className='mb-6'>
        <button
          onClick={onBack}
          className='flex items-center gap-2 text-gray-600 hover:text-black transition mb-4'
        >
          <FiChevronLeft className='w-5 h-5' />
          Back
        </button>
        <div className='bg-gray-50 rounded-xl p-6 mb-6'>
          <div className='flex flex-wrap gap-3 items-center justify-between'>
            <div>
              <h2 className='text-2xl font-semibold text-black mb-1'>
                {category?.name}
              </h2>
              <div className='flex flex-wrap gap-2 mt-2'>
                {selectedTrade && (
                  <span className='px-3 py-1 bg-gray-200 rounded-full text-sm'>
                    📌 {selectedTrade}
                  </span>
                )}
                {selectedYear && (
                  <span className='px-3 py-1 bg-gray-200 rounded-full text-sm'>
                    📅 {selectedYear}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onReset}
              className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'
            >
              Start Over
            </button>
          </div>
        </div>
      </div>

      {papers.length > 0 ? (
        <div className='space-y-3'>
          {papers.map((paper) => (
            <PaperCard key={paper._id} paper={paper} isVIP={isVIP} />
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <p className='text-gray-500 mb-4'>
            No papers found for this selection
          </p>
          <button
            onClick={onReset}
            className='px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition'
          >
            Browse Again
          </button>
        </div>
      )}
    </div>
  );
};

export default PapersDisplay;
