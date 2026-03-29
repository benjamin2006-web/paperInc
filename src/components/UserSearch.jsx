import { useEffect, useRef, useState } from 'react';
import {
  FiBell,
  FiCalendar,
  FiFileText,
  FiSearch,
  FiTool,
  FiX,
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const UserSearch = ({ children, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Fetch announcements
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements');
      setAnnouncements(response.data.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/papers/suggestions?q=${encodeURIComponent(searchQuery)}`,
      );
      setSuggestions(response.data.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      }
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    if (onSearch) {
      onSearch(suggestion);
    }
    navigate(`/?search=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (onSearch) {
      onSearch('');
    }
    navigate('/');
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className='bg-yellow-200 text-black'>
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white'>
      {/* Header */}
      <header className='border-b border-gray-200 bg-white sticky top-0 z-50'>
        <div className='max-w-6xl mx-auto px-4 py-4'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
            <Link
              to='/'
              className='text-xl font-bold text-black flex items-center gap-2'
            >
              📚 Exam Papers Archive
            </Link>

            {/* Announcement Bell */}
            {announcements.length > 0 && (
              <div className='relative'>
                <button
                  onClick={() => setShowAnnouncements(!showAnnouncements)}
                  className='relative p-2 text-gray-600 hover:text-black transition'
                >
                  <FiBell className='w-5 h-5' />
                  {announcements.filter((a) => !a.seen).length > 0 && (
                    <span className='absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full'></span>
                  )}
                </button>

                {showAnnouncements && (
                  <div className='absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
                    <div className='p-3 border-b border-gray-200'>
                      <h3 className='font-semibold text-black'>
                        Announcements
                      </h3>
                    </div>
                    <div className='max-h-64 overflow-y-auto'>
                      {announcements.map((announcement, index) => (
                        <div
                          key={index}
                          className='p-3 border-b border-gray-100 hover:bg-gray-50'
                        >
                          <p className='text-sm text-gray-800'>
                            {announcement.message}
                          </p>
                          <p className='text-xs text-gray-500 mt-1'>
                            {new Date(announcement.date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search Bar */}
            <div ref={searchRef} className='w-full md:w-auto relative'>
              <form onSubmit={handleSearch}>
                <div className='relative'>
                  <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <input
                    type='text'
                    placeholder='Search by year, trade, or exam title...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() =>
                      searchQuery.trim() && setShowSuggestions(true)
                    }
                    className='w-full md:w-96 pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition'
                  />
                  {searchQuery && (
                    <button
                      type='button'
                      onClick={clearSearch}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                    >
                      <FiX className='w-4 h-4' />
                    </button>
                  )}
                </div>
              </form>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className='absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto'>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className='w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0'
                    >
                      <div className='flex items-start gap-3'>
                        <div className='flex-shrink-0 mt-0.5'>
                          {suggestion.type === 'year' && (
                            <FiCalendar className='w-4 h-4 text-gray-400' />
                          )}
                          {suggestion.type === 'trade' && (
                            <FiTool className='w-4 h-4 text-gray-400' />
                          )}
                          {suggestion.type === 'title' && (
                            <FiFileText className='w-4 h-4 text-gray-400' />
                          )}
                        </div>
                        <div className='flex-1'>
                          <div className='text-sm font-medium text-gray-900'>
                            {highlightMatch(suggestion.text, searchQuery)}
                          </div>
                          <div className='text-xs text-gray-500 mt-1'>
                            {suggestion.type === 'year' && 'Year'}
                            {suggestion.type === 'trade' && 'Trade'}
                            {suggestion.type === 'title' && 'Exam Title'}
                            {suggestion.count &&
                              ` • ${suggestion.count} paper(s)`}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className='absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4'>
                  <div className='flex items-center justify-center gap-2'>
                    <div className='w-4 h-4 border-2 border-gray-200 rounded-full animate-spin border-t-black'></div>
                    <span className='text-sm text-gray-500'>Searching...</span>
                  </div>
                </div>
              )}
            </div>

            <Link
              to='/admin/login'
              className='text-sm text-gray-600 hover:text-black transition'
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      {/* Announcement Banner (if any active announcements) */}
      {announcements.filter((a) => a.showBanner).length > 0 && (
        <div className='bg-yellow-50 border-b border-yellow-200'>
          <div className='max-w-6xl mx-auto px-4 py-2'>
            <p className='text-sm text-yellow-800 text-center'>
              {announcements.find((a) => a.showBanner)?.message}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className='max-w-6xl mx-auto px-4 py-8'>{children}</main>

      {/* Footer */}
      <footer className='border-t border-gray-200 bg-white mt-12'>
        <div className='max-w-6xl mx-auto px-4 py-6'>
          <p className='text-center text-sm text-gray-500'>
            © {new Date().getFullYear()} Exam Papers Archive. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default UserSearch;
