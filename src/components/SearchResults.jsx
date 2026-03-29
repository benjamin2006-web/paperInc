import React from 'react';
import PaperCard from './PaperCard';

const SearchResults = ({ results, query, loading, onClear, isVIP = false }) => {
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
      {/* Search Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <div>
            <h2 className='text-2xl font-semibold text-black mb-2'>
              Search Results
            </h2>
            <p className='text-gray-600'>
              {results?.length || 0} result(s) found for "{query}"
            </p>
          </div>
          <button
            onClick={onClear}
            className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'
          >
            <FiX className='w-4 h-4' />
            Clear Search
          </button>
        </div>
      </div>

      {/* Results */}
      {results?.length === 0 ? (
        <div className='text-center py-12'>
          <FiSearch className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-500 text-lg'>
            No papers found matching "{query}"
          </p>
          <p className='text-gray-400 mt-2'>
            Try searching by year, trade name, or exam title
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {results.map((paper) => (
            <PaperCard key={paper._id} paper={paper} isVIP={isVIP} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
