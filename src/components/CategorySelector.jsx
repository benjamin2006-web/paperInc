import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const CategorySelector = ({ categories, onSelectCategory, loading: parentLoading }) => {
  const [localCategories, setLocalCategories] = useState(categories);
  const [loading, setLoading] = useState(parentLoading);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('online'); // 'online', 'slow', 'offline'
  const [retryCount, setRetryCount] = useState(0);
  const [showOfflinePopup, setShowOfflinePopup] = useState(false);
  const [showReconnectPopup, setShowReconnectPopup] = useState(false);
  const intervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const popupTimeoutRef = useRef(null);

  // Check actual internet connectivity
  const checkInternetConnectivity = async () => {
    try {
      // Try to fetch a small resource to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Show popup notification
  const showPopup = (type, message) => {
    if (type === 'offline') {
      setShowOfflinePopup(true);
      setShowReconnectPopup(false);
      
      // Auto hide after 8 seconds
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = setTimeout(() => {
        setShowOfflinePopup(false);
      }, 8000);
    } else if (type === 'reconnect') {
      setShowReconnectPopup(true);
      setShowOfflinePopup(false);
      
      // Auto hide after 5 seconds
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = setTimeout(() => {
        setShowReconnectPopup(false);
      }, 5000);
    }
  };

  // Monitor connection status
  useEffect(() => {
    let connectionMonitorInterval;
    let onlineStatus = navigator.onLine;

    const handleOnline = async () => {
      onlineStatus = true;
      const isReallyConnected = await checkInternetConnectivity();
      
      if (isReallyConnected) {
        setConnectionStatus('online');
        showPopup('reconnect', 'Internet connection restored!');
        
        // Auto refresh categories when connection is back
        setTimeout(() => {
          fetchCategories(true);
        }, 1000);
      }
    };

    const handleOffline = () => {
      onlineStatus = false;
      setConnectionStatus('offline');
      showPopup('offline', 'No internet connection. Please check your network.');
    };

    // Monitor online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Additional monitor for connection quality (every 10 seconds)
    connectionMonitorInterval = setInterval(async () => {
      const isOnline = navigator.onLine;
      
      if (isOnline && connectionStatus === 'offline') {
        const isReallyConnected = await checkInternetConnectivity();
        if (isReallyConnected) {
          handleOnline();
        }
      } else if (!isOnline && connectionStatus !== 'offline') {
        handleOffline();
      }
    }, 10000);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectionMonitorInterval);
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, [connectionStatus]);

  // Check connection speed
  const checkConnectionSpeed = async () => {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('/api/categories?limit=1', { 
        signal: controller.signal,
        method: 'HEAD'
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      if (duration > 3000) {
        setConnectionStatus('slow');
      } else if (connectionStatus !== 'offline') {
        setConnectionStatus('online');
      }
    } catch (error) {
      if (connectionStatus !== 'offline') {
        setConnectionStatus('slow');
      }
    }
  };

  // Fetch categories with retry logic for slow connections
  const fetchCategories = async (showLoading = false, retryAttempt = 0) => {
    // Don't fetch if offline
    if (connectionStatus === 'offline') {
      if (showLoading) {
        showPopup('offline', 'Cannot load categories. Please check your internet connection.');
      }
      return false;
    }
    
    if (showLoading) setLoading(true);
    
    try {
      // Check connection speed before fetching
      await checkConnectionSpeed();
      
      // Set timeout for slow connections (30 seconds for slow, 10 seconds for normal)
      const timeoutDuration = connectionStatus === 'slow' ? 30000 : 10000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      const response = await api.get('/categories', {
        signal: controller.signal,
        timeout: timeoutDuration
      });
      
      clearTimeout(timeoutId);
      
      const categoriesData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      
      setLocalCategories(categoriesData);
      setLastUpdate(new Date());
      setRetryCount(0);
      
      if (connectionStatus !== 'online') {
        setConnectionStatus('online');
      }
      
      return true;
    } catch (error) {
      console.error('Error fetching categories:', error);
      
      // Retry logic for slow connections
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        setConnectionStatus('slow');
        
        if (retryAttempt < 3) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, retryAttempt) * 1000;
          
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          retryTimeoutRef.current = setTimeout(() => {
            fetchCategories(showLoading, retryAttempt + 1);
          }, delay);
          
          return false;
        }
      }
      
      // Check if it's a network error
      if (error.message === 'Network Error' || !navigator.onLine) {
        setConnectionStatus('offline');
        showPopup('offline', 'Connection lost. Please check your internet.');
      }
      
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Auto-refresh with adaptive interval
  useEffect(() => {
    // Initial fetch
    if (connectionStatus !== 'offline') {
      fetchCategories(true);
    }
    
    // Adaptive refresh interval: 60s for slow, 30s for normal
    const refreshInterval = connectionStatus === 'slow' ? 60000 : 30000;
    
    // Set up interval for background refresh
    intervalRef.current = setInterval(() => {
      // Only refresh if online or slow (not offline)
      if (connectionStatus !== 'offline') {
        fetchCategories(false);
      }
    }, refreshInterval);
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [connectionStatus]);

  // Update when parent categories change
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Offline Popup Component
  const OfflinePopup = () => {
    if (!showOfflinePopup) return null;
    
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-4 min-w-[300px] max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800">
                No Internet Connection
              </p>
              <p className="text-sm text-red-700 mt-1">
                Please check your network settings and connect to the internet.
              </p>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Retry Connection →
              </button>
            </div>
            <button
              onClick={() => setShowOfflinePopup(false)}
              className="ml-4 flex-shrink-0"
            >
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Reconnect Popup Component
  const ReconnectPopup = () => {
    if (!showReconnectPopup) return null;
    
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg shadow-lg p-4 min-w-[300px] max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Connection Restored!
              </p>
              <p className="text-sm text-green-700 mt-1">
                Your internet connection is back. Refreshing categories...
              </p>
            </div>
            <button
              onClick={() => setShowReconnectPopup(false)}
              className="ml-4 flex-shrink-0"
            >
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading Spinner Component
  const LoadingSpinner = () => {
    const [dots, setDots] = useState('');
    const [progress, setProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('Loading categories');

    useEffect(() => {
      const dotInterval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);
      
      const messageTimeout = setTimeout(() => {
        if (connectionStatus === 'slow') {
          setLoadingMessage('Still loading on slow connection');
        } else if (progress > 50) {
          setLoadingMessage('Almost there');
        }
      }, 3000);
      
      return () => {
        clearInterval(dotInterval);
        clearInterval(progressInterval);
        clearTimeout(messageTimeout);
      };
    }, []);

    return (
      <div className='text-center py-12 animate-fadeIn'>
        <div className='flex flex-col items-center justify-center space-y-4'>
          <div className='relative'>
            <div className='w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-black'></div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='w-8 h-8 bg-black rounded-full animate-pulse'></div>
            </div>
          </div>
          
          {connectionStatus === 'slow' && (
            <div className='w-64 mt-2'>
              <div className='bg-gray-200 rounded-full h-1 overflow-hidden'>
                <div 
                  className='bg-black h-1 rounded-full transition-all duration-300'
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
              <p className='text-xs text-gray-400 mt-1'>
                {Math.floor(progress)}% complete
              </p>
            </div>
          )}
          
          <p className='text-gray-500 text-sm font-medium'>
            {loadingMessage}{dots}
          </p>
          
          {connectionStatus === 'slow' && (
            <div className='flex items-center space-x-2 text-yellow-600 text-xs'>
              <svg className='w-4 h-4 animate-pulse' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <span>Slow connection detected</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Empty state component
  if (!loading && localCategories.length === 0) {
    return (
      <>
        <OfflinePopup />
        <ReconnectPopup />
        <div className='text-center py-12 animate-fadeIn'>
          <div className='inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-4 animate-bounce'>
            {connectionStatus === 'offline' ? (
              <svg className='w-10 h-10 text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 5.636L5.636 18.364M5.636 5.636l12.728 12.728' />
              </svg>
            ) : (
              <svg className='w-10 h-10 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
            )}
          </div>
          
          {connectionStatus === 'offline' ? (
            <>
              <p className='text-gray-600 font-medium'>No Internet Connection</p>
              <p className='text-gray-400 text-sm mt-2'>
                Please connect to the internet to load categories
              </p>
              <button
                onClick={() => window.location.reload()}
                className='mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all'
              >
                Retry Connection
              </button>
            </>
          ) : (
            <>
              <p className='text-gray-600'>No categories available</p>
              <p className='text-gray-400 text-sm mt-2'>
                Please contact administrator on 0792098874
              </p>
              <button
                onClick={() => fetchCategories(true)}
                className='mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all'
              >
                Refresh
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <OfflinePopup />
      <ReconnectPopup />
      
      <div className='animate-fadeIn'>
        {/* Status bar */}
        <div className='flex justify-between items-center mb-4 px-2'>
          {lastUpdate && (
            <div className='text-xs text-gray-400'>
              {getLastUpdateText()}
            </div>
          )}
          
          {/* Connection status indicator */}
          {connectionStatus === 'slow' && (
            <div className='flex items-center space-x-1 text-yellow-600 text-xs bg-yellow-50 px-2 py-1 rounded-full'>
              <svg className='w-3 h-3 animate-pulse' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <span>Slow connection</span>
            </div>
          )}
          
          {connectionStatus === 'online' && lastUpdate && (
            <div className='flex items-center space-x-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full'>
              <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
              <span>Connected</span>
            </div>
          )}
          
          {/* Manual refresh button */}
          <button
            onClick={() => fetchCategories(true)}
            disabled={loading || connectionStatus === 'offline'}
            className='text-xs text-gray-400 hover:text-gray-600 transition flex items-center space-x-1 disabled:opacity-50'
          >
            <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
        
        <h2 className='text-2xl font-semibold text-black mb-6 text-center'>
          Select Category
        </h2>
        
        {loading && localCategories.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {localCategories.map((category, index) => (
              <button
                key={category._id || category.id || index}
                onClick={() => onSelectCategory(category)}
                className='group p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all text-left hover:scale-105 transform duration-200 animate-slideIn'
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className='text-4xl mb-3'>
                  {category.icon || (
                    <svg className='w-12 h-12 text-gray-400 group-hover:text-black transition-colors' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                    </svg>
                  )}
                </div>
                <h3 className='text-lg font-semibold text-black mb-1 group-hover:text-black transition'>
                  {category.name}
                </h3>
                <p className='text-sm text-gray-500 group-hover:text-gray-600 transition'>
                  {category.description || 'Click to browse papers'}
                </p>
                <div className='mt-3 text-xs text-gray-400 group-hover:text-gray-500 transition'>
                  Browse papers →
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translate(-50%, -100%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }
  
  .animate-slideIn {
    animation: slideIn 0.3s ease-out forwards;
    opacity: 0;
  }
  
  .animate-slideDown {
    animation: slideDown 0.3s ease-out forwards;
  }
`;

document.head.appendChild(style);

export default CategorySelector;
