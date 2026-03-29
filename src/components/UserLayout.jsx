import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiBell,
  FiCalendar,
  FiFileText,
  FiLogOut,
  FiMenu,
  FiPhone,
  FiSearch,
  FiTool,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const UserLayout = ({ children, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const searchRef = useRef(null);
  const debounceTimeout = useRef(null);
  const isMounted = useRef(true);
  const announcementsFetched = useRef(false); // Prevent multiple fetches
  const navigate = useNavigate();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');

    if (token && userData && userData !== 'undefined' && userData !== 'null') {
      try {
        const parsedUser = JSON.parse(userData);
        if (isMounted.current) {
          setUser(parsedUser);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('userData');
        localStorage.removeItem('userToken');
        if (isMounted.current) setUser(null);
      }
    } else {
      if (isMounted.current) setUser(null);
    }
  }, []);

  // Fetch announcements - ONLY ONCE
  useEffect(() => {
    if (announcementsFetched.current) return;
    announcementsFetched.current = true;

    const fetchAnnouncementsData = async () => {
      try {
        const response = await api.get('/announcements');
        if (isMounted.current) {
          setAnnouncements(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    fetchAnnouncementsData();
  }, []); // Empty dependency array - runs only once

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        if (isMounted.current) setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (searchQuery.trim().length > 0) {
      debounceTimeout.current = setTimeout(() => {
        fetchSuggestions();
      }, 300);
    } else {
      if (isMounted.current) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery]);

  const fetchSuggestions = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const response = await api.get(
        `/papers/suggestions?q=${encodeURIComponent(searchQuery)}`,
      );
      if (isMounted.current) {
        setSuggestions(response.data.data || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      if (isMounted.current) {
        setSuggestions([]);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      if (isMounted.current) {
        setShowSuggestions(false);
        setMobileMenuOpen(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    if (onSearch) onSearch(suggestion);
    navigate(`/?search=${encodeURIComponent(suggestion)}`);
    if (isMounted.current) setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (isMounted.current) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    if (onSearch) onSearch('');
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    if (isMounted.current) setUser(null);
    navigate('/');
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className='bg-yellow-200 text-black px-0.5'>
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const activeBannerAnnouncements = announcements.filter((a) => {
    if (!a.showBanner) return false;
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
    return true;
  });

  const activeBellAnnouncements = announcements.filter((a) => {
    if (!a.showBell) return false;
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
    return true;
  });

  return (
    <div className='min-h-screen bg-white flex flex-col'>
      {/* Header */}
      <header className='border-b border-gray-200 bg-white sticky top-0 z-50'>
        <div className='w-full px-4'>
          <div className='flex items-center justify-between h-16 gap-3'>
            {/* Logo */}
            <Link
              to='/'
              className='text-lg sm:text-xl font-bold text-black flex items-center gap-1 flex-shrink-0'
            >
              <span>Paper Inc</span>
              <span className='hidden xs:inline'>Exam Papers</span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className='hidden md:block flex-1 max-w-md' ref={searchRef}>
              <SearchForm
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                clearSearch={clearSearch}
                showSuggestions={showSuggestions}
                suggestions={suggestions}
                handleSuggestionClick={handleSuggestionClick}
                highlightMatch={highlightMatch}
                loading={loading}
              />
            </div>

            {/* Right Side Icons */}
            <div className='flex items-center gap-2'>
              {/* Announcement Bell */}
              {activeBellAnnouncements.length > 0 && (
                <div className='relative'>
                  <button
                    onClick={() => setShowAnnouncements(!showAnnouncements)}
                    className='p-2 text-gray-600 hover:text-black transition'
                  >
                    <FiBell className='w-5 h-5' />
                    <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full'></span>
                  </button>
                  {showAnnouncements && (
                    <div className='absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto'>
                      <div className='p-3 border-b border-gray-200'>
                        <h3 className='font-semibold text-black'>
                          Announcements
                        </h3>
                      </div>
                      {activeBellAnnouncements.map((announcement, index) => (
                        <div
                          key={index}
                          className='p-3 border-b border-gray-100 hover:bg-gray-50'
                        >
                          <p className='text-sm font-medium text-gray-900'>
                            {announcement.title}
                          </p>
                          <p className='text-xs text-gray-600 mt-1'>
                            {announcement.message}
                          </p>
                          <p className='text-xs text-gray-400 mt-1'>
                            {new Date(
                              announcement.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* User Menu - Login/Register or User Profile */}
              {user ? (
                // Logged in user
                <div className='relative'>
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className='flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-black transition border border-gray-200 rounded-lg'
                  >
                    <FiUser className='w-4 h-4' />
                    <span className='hidden sm:inline'>
                      {user.name || 'User'}
                    </span>
                  </button>
                  {mobileMenuOpen && (
                    <div className='absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
                      <Link
                        to='/profile'
                        className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition'
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FiUser className='w-4 h-4' />
                        My Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition flex items-center gap-2'
                      >
                        <FiLogOut className='w-4 h-4' />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Guest user - show Login/Register buttons
                <div className='hidden md:flex items-center gap-2'>
                  <Link
                    to='/login'
                    className='px-3 py-1.5 text-sm text-gray-600 hover:text-black transition'
                  >
                    Login
                  </Link>
                  <Link
                    to='/register'
                    className='px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition'
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className='md:hidden p-2 text-gray-600 hover:text-black transition'
              >
                <FiMenu className='w-5 h-5' />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className='md:hidden pb-3' ref={searchRef}>
            <SearchForm
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
              clearSearch={clearSearch}
              showSuggestions={showSuggestions}
              suggestions={suggestions}
              handleSuggestionClick={handleSuggestionClick}
              highlightMatch={highlightMatch}
              loading={loading}
            />
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className='md:hidden border-t border-gray-200 py-3 space-y-2'>
              {user ? (
                <>
                  <div className='px-3 py-2 text-sm text-gray-600 border-b border-gray-100'>
                    <p className='font-medium'>{user.name}</p>
                    <p className='text-xs'>{user.phone || user.email}</p>
                  </div>
                  <Link
                    to='/profile'
                    className='block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiUser className='w-4 h-4 inline mr-2' />
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 transition'
                  >
                    <FiLogOut className='w-4 h-4 inline mr-2' />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to='/register'
                    className='block px-3 py-2 text-sm bg-black text-white rounded-lg text-center hover:bg-gray-800 transition'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Create Account
                  </Link>
                  <Link
                    to='/login'
                    className='block px-3 py-2 text-sm text-gray-600 hover:text-black transition text-center'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Announcement Banner */}
      {activeBannerAnnouncements.length > 0 && (
        <div className='bg-yellow-50 border-b border-yellow-200'>
          <div className='w-full px-4 py-2'>
            <div className='flex items-center gap-2'>
              <FiBell className='w-4 h-4 text-yellow-600 flex-shrink-0' />
              <p className='text-xs text-yellow-800 truncate'>
                {activeBannerAnnouncements[0].message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Full Width */}
      <main className='flex-1 w-full px-4 py-6 sm:py-8'>{children}</main>

      {/* Footer - Full Width */}
      <footer className='bg-white border-t border-gray-200 mt-12'>
        <div className='w-full px-4 py-6'>
          <div className='flex flex-col sm:flex-row justify-between items-center gap-3'>
            {/* WhatsApp Contact */}
            <div className='flex items-center gap-2'>
              <FiPhone className='w-4 h-4 text-gray-500' />
              <a
                href='https://wa.me/250792098874'
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm text-gray-600 hover:text-black transition'
              >
                0792098874
              </a>
            </div>

            {/* Powered by */}
            <div className='flex items-center gap-1'>
              <span className='text-xs text-gray-500'>Powered by</span>
              <a
                href='https://cv-red-phi.vercel.app'
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm font-medium text-black hover:underline transition'
              >
                Next Inc
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Search Form Component
const SearchForm = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  clearSearch,
  showSuggestions,
  suggestions,
  handleSuggestionClick,
  highlightMatch,
  loading,
}) => (
  <form onSubmit={handleSearch} className='relative'>
    <div className='relative'>
      <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
      <input
        type='text'
        placeholder='Search by year, trade, or exam title...'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
        className='w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition'
      />
      {searchQuery && (
        <button
          type='button'
          onClick={clearSearch}
          className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
        >
          <FiX className='w-4 h-4' />
        </button>
      )}
    </div>

    {showSuggestions && suggestions.length > 0 && (
      <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto'>
        {suggestions.slice(0, 5).map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion.text)}
            className='w-full text-left px-3 py-2 hover:bg-gray-50 transition text-sm'
          >
            <div className='flex items-center gap-2'>
              {suggestion.type === 'year' && (
                <FiCalendar className='w-3 h-3 text-gray-400' />
              )}
              {suggestion.type === 'trade' && (
                <FiTool className='w-3 h-3 text-gray-400' />
              )}
              {suggestion.type === 'title' && (
                <FiFileText className='w-3 h-3 text-gray-400' />
              )}
              <span className='text-gray-900'>
                {highlightMatch(suggestion.text, searchQuery)}
              </span>
              {suggestion.count && (
                <span className='text-xs text-gray-400'>
                  ({suggestion.count})
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    )}

    {loading && (
      <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2'>
        <div className='flex items-center justify-center gap-2'>
          <div className='w-3 h-3 border-2 border-gray-200 rounded-full animate-spin border-t-black'></div>
          <span className='text-xs text-gray-500'>Searching...</span>
        </div>
      </div>
    )}
  </form>
);

export default UserLayout;
