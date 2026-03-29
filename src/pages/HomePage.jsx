import { useCallback, useEffect, useRef, useState } from 'react';
import { FiBell, FiInfo, FiX } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import CategorySelector from '../components/CategorySelector';
import PapersDisplay from '../components/PapersDisplay';
import TradeSelector from '../components/TradeSelector';
import UserLayout from '../components/UserLayout';
import WelcomeCarousel from '../components/WelcomeCarousel';
import YearSelector from '../components/YearSelector';
import api from '../services/api';

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [trades, setTrades] = useState({});
  const [papers, setPapers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [view, setView] = useState('categories');
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementSection, setShowAnnouncementSection] = useState(true);
  const [showWelcomeCarousel, setShowWelcomeCarousel] = useState(false);
  const [hasShownCarousel, setHasShownCarousel] = useState(false);
  const [carouselCancelled, setCarouselCancelled] = useState(false);
  const [isVIP, setIsVIP] = useState(false);
  const query = searchParams.get('search');

  // Refs to prevent infinite loops
  const isMounted = useRef(true);
  const dataLoaded = useRef(false);
  const carouselTimer = useRef(null);

  // Check VIP status
  useEffect(() => {
    const checkVIPStatus = async () => {
      const token = localStorage.getItem('userToken');
      if (token) {
        try {
          const response = await api.get('/users/me');
          if (isMounted.current) {
            setIsVIP(response.data.user?.isVIP || false);
          }
        } catch (error) {
          console.error('Error checking VIP status:', error);
        }
      }
    };
    checkVIPStatus();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (carouselTimer.current) {
        clearTimeout(carouselTimer.current);
      }
    };
  }, []);

  // Load data - ONLY ONCE
  useEffect(() => {
    if (dataLoaded.current) return;
    dataLoaded.current = true;

    const loadDataOnce = async () => {
      setLoading(true);
      try {
        const [categoriesRes, tradesRes, papersRes] = await Promise.all([
          api.get('/categories'),
          api.get('/trades'),
          api.get('/papers'),
        ]);

        if (!isMounted.current) return;

        if (categoriesRes.data && Array.isArray(categoriesRes.data)) {
          setCategories(
            categoriesRes.data.filter((cat) => cat.enabled !== false),
          );
        }
        if (tradesRes.data) {
          setTrades(tradesRes.data);
        }
        setPapers(papersRes.data.data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    loadDataOnce();
  }, []);

  // Fetch announcements - ONLY ONCE
  useEffect(() => {
    const fetchAnnouncementsOnce = async () => {
      try {
        const response = await api.get('/announcements');
        if (!isMounted.current) return;
        if (response.data && response.data.data) {
          const bannerAnnouncements = response.data.data.filter(
            (a) => a.showBanner === true,
          );
          setAnnouncements(bannerAnnouncements);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    fetchAnnouncementsOnce();
  }, []);

  // Carousel timer
  useEffect(() => {
    carouselTimer.current = setTimeout(() => {
      if (
        !hasShownCarousel &&
        !localStorage.getItem('hasSeenWelcomeCarousel') &&
        !carouselCancelled &&
        isMounted.current
      ) {
        setShowWelcomeCarousel(true);
        setHasShownCarousel(true);
      }
    }, 60000);

    return () => {
      if (carouselTimer.current) {
        clearTimeout(carouselTimer.current);
      }
    };
  }, [carouselCancelled, hasShownCarousel]);

  // Handle search query from URL
  useEffect(() => {
    if (query) {
      handleSearch(query);
    } else {
      if (isMounted.current) {
        setSearchResults(null);
      }
    }
  }, [query]);

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery) {
      if (isMounted.current) setSearchResults(null);
      return;
    }

    if (!isMounted.current) return;
    setLoading(true);
    try {
      const response = await api.get(
        `/papers/search?q=${encodeURIComponent(searchQuery)}`,
      );
      if (isMounted.current) {
        setSearchResults(response.data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
      if (isMounted.current) setSearchResults([]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  const handleCategorySelect = useCallback((category) => {
    if (!isMounted.current) return;
    setSelectedCategory(category);
    setView('trades');
  }, []);

  const handleTradeSelect = useCallback(
    (trade) => {
      if (!isMounted.current) return;
      setSelectedTrade(trade);
      setView('years');

      const years = [
        ...new Set(
          papers
            .filter(
              (p) => p.category === selectedCategory?.id && p.trade === trade,
            )
            .map((p) => p.year),
        ),
      ].sort((a, b) => b - a);
      setAvailableYears(years);
    },
    [papers, selectedCategory],
  );

  const handleTradeSkip = useCallback(() => {
    if (!isMounted.current) return;
    setView('years');
    const years = [
      ...new Set(
        papers
          .filter((p) => p.category === selectedCategory?.id)
          .map((p) => p.year),
      ),
    ].sort((a, b) => b - a);
    setAvailableYears(years);
  }, [papers, selectedCategory]);

  const handleYearSelect = useCallback(
    (year) => {
      if (!isMounted.current) return;
      setSelectedYear(year);
      setView('papers');

      const filtered = papers.filter(
        (p) =>
          p.category === selectedCategory?.id &&
          (!selectedTrade || p.trade === selectedTrade) &&
          p.year === year,
      );
      setFilteredPapers(filtered);
    },
    [papers, selectedCategory, selectedTrade],
  );

  const handleBackToCategories = useCallback(() => {
    if (!isMounted.current) return;
    setView('categories');
    setSelectedCategory(null);
    setSelectedTrade(null);
    setSelectedYear(null);
    setFilteredPapers([]);
  }, []);

  const handleBackToTrades = useCallback(() => {
    if (!isMounted.current) return;

    // Check if the category has trades
    const categoryHasTrades = trades[selectedCategory?.id]?.length > 0;

    if (categoryHasTrades) {
      // Go back to trades if there are trades
      setView('trades');
    } else {
      // If no trades, go back to categories
      setView('categories');
      setSelectedCategory(null);
    }
    setSelectedTrade(null);
    setSelectedYear(null);
  }, [trades, selectedCategory]);

  const handleBackToYears = useCallback(() => {
    if (!isMounted.current) return;

    // Check if the category has trades to determine where to go
    const categoryHasTrades = trades[selectedCategory?.id]?.length > 0;

    if (categoryHasTrades) {
      setView('trades');
    } else {
      setView('categories');
      setSelectedCategory(null);
    }
    setSelectedYear(null);
  }, [trades, selectedCategory]);

  const clearSearch = useCallback(() => {
    setSearchParams({});
    if (isMounted.current) setSearchResults(null);
  }, [setSearchParams]);

  const handleRegister = useCallback((userData) => {
    console.log('User registered:', userData);
    localStorage.setItem('hasSeenWelcomeCarousel', 'true');
    if (isMounted.current) setShowWelcomeCarousel(false);
    alert('Registration successful! You now have access to premium content.');
  }, []);

  const handleCloseCarousel = useCallback(() => {
    if (isMounted.current) {
      setCarouselCancelled(true);
      setShowWelcomeCarousel(false);
    }
  }, []);

  const handleCancelCarousel = useCallback(() => {
    if (isMounted.current) {
      setCarouselCancelled(true);
      setShowWelcomeCarousel(false);
    }
  }, []);

  // Show loading only on initial load
  if (
    loading &&
    !searchResults &&
    categories.length === 0 &&
    !dataLoaded.current
  ) {
    return (
      <div className='min-h-[400px] flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-black mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <UserLayout onSearch={handleSearch}>
      {/* Welcome Carousel */}
      {showWelcomeCarousel && (
        <WelcomeCarousel
          onClose={handleCloseCarousel}
          onRegister={handleRegister}
          onCancel={handleCancelCarousel}
        />
      )}

      {/* Main Content - Full Width */}
      <div className='w-full'>
        {searchResults !== null ? (
          <PapersDisplay
            papers={searchResults}
            query={query}
            loading={loading}
            onClear={clearSearch}
            isVIP={isVIP}
          />
        ) : (
          <>
            {view === 'categories' && (
              <CategorySelector
                categories={categories}
                onSelectCategory={handleCategorySelect}
              />
            )}

            {view === 'trades' && selectedCategory && (
              <TradeSelector
                category={selectedCategory}
                trades={trades}
                onSelectTrade={handleTradeSelect}
                onBack={handleBackToCategories}
                onSkip={handleTradeSkip}
              />
            )}

            {view === 'years' && (
              <YearSelector
                category={selectedCategory}
                selectedTrade={selectedTrade}
                availableYears={availableYears}
                onSelectYear={handleYearSelect}
                onBack={handleBackToTrades}
                onReset={handleBackToCategories}
              />
            )}

            {view === 'papers' && (
              <PapersDisplay
                papers={filteredPapers}
                category={selectedCategory}
                selectedTrade={selectedTrade}
                selectedYear={selectedYear}
                onBack={handleBackToYears}
                onReset={handleBackToCategories}
                isVIP={isVIP}
              />
            )}
          </>
        )}
      </div>

      {/* Announcement Section - Full Width */}
      {announcements.length > 0 && showAnnouncementSection && (
        <div className='w-full mt-12 pt-8 border-t border-gray-200'>
          <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 border-b border-gray-200'>
              <div className='flex items-center gap-2'>
                <FiBell className='w-5 h-5 text-blue-600' />
                <h2 className='text-base sm:text-lg font-semibold text-gray-900'>
                  Latest Announcements ({announcements.length})
                </h2>
              </div>
            </div>
            <div className='divide-y divide-gray-100'>
              {announcements.map((announcement, index) => (
                <div
                  key={announcement._id || index}
                  className='p-4 sm:p-5 hover:bg-gray-50 transition-colors'
                >
                  <div className='flex items-start gap-3 sm:gap-4'>
                    <div className='flex-shrink-0'>
                      <div className='w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                        <FiInfo className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600' />
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-2'>
                        <h3 className='font-semibold text-gray-900 text-sm sm:text-base'>
                          {announcement.title || 'Announcement'}
                        </h3>
                        <span className='text-xs text-gray-500'>
                          {new Date(
                            announcement.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <p className='text-gray-700 text-sm leading-relaxed break-words'>
                        {announcement.message}
                      </p>
                      {announcement.expiresAt && (
                        <p className='text-xs text-gray-400 mt-2'>
                          Valid until:{' '}
                          {new Date(
                            announcement.expiresAt,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className='bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-200 flex justify-between items-center'>
              <p className='text-xs text-gray-500'>
                Stay updated with the latest announcements
              </p>
              <button
                onClick={() => setShowAnnouncementSection(false)}
                className='text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1'
              >
                <FiX className='w-3 h-3' />
                Hide
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
};

export default HomePage;
