// components/CategorySelector.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import SnakeGame from './SnakeGame';

// Move CSS to a separate file or add once globally
const addGlobalStyles = () => {
  if (!document.getElementById('category-selector-styles')) {
    const style = document.createElement('style');
    style.id = 'category-selector-styles';
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
      
      @keyframes bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }
      
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
      
      @keyframes dotPulse {
        0%, 60%, 100% {
          transform: scale(1);
          opacity: 0.6;
        }
        30% {
          transform: scale(1.2);
          opacity: 1;
        }
      }
      
      .animate-fadeIn {
        animation: fadeIn 0.5s ease-out;
      }
      
      .animate-slideIn {
        animation: slideIn 0.3s ease-out forwards;
      }
      
      .animate-bounce {
        animation: bounce 1s infinite;
      }
      
      .animate-spin {
        animation: spin 1s linear infinite;
      }
      
      .animate-pulse {
        animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      .dot {
        animation: dotPulse 1.4s infinite ease-in-out;
      }
      
      .dot:nth-child(1) {
        animation-delay: 0s;
      }
      
      .dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .dot:nth-child(3) {
        animation-delay: 0.4s;
      }
    `;
    document.head.appendChild(style);
  }
};

const CategorySelector = ({ categories, onSelectCategory, loading: parentLoading }) => {
  const [localCategories, setLocalCategories] = useState(categories);
  const [loading, setLoading] = useState(parentLoading);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(() => {
    return navigator.onLine ? 'online' : 'offline';
  });
  const [showSnakeGame, setShowSnakeGame] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading categories');
  const intervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const connectionMonitorRef = useRef(null);
  const isMountedRef = useRef(true);

  // Add global styles once
  useEffect(() => {
    addGlobalStyles();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Three dots animation effect
  useEffect(() => {
    if (loading) {
      const messages = [
        'Loading categories',
        'Fetching data',
        'Connecting to server',
        'Almost there'
      ];
      let messageIndex = 0;
      
      const messageInterval = setInterval(() => {
        if (isMountedRef.current && loading) {
          messageIndex = (messageIndex + 1) % messages.length;
          setLoadingMessage(messages[messageIndex]);
        }
      }, 3000);
      
      return () => clearInterval(messageInterval);
    }
  }, [loading]);

  // Check internet connectivity
  const checkInternetConnectivity = useCallback(async () => {
    if (!navigator.onLine) {
      return false;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const endpoints = [
        'https://www.google.com/favicon.ico',
        'https://www.cloudflare.com/favicon.ico',
        '/api/health'
      ];
      
      for (const endpoint of endpoints) {
        try {
          await fetch(endpoint, {
            mode: 'no-cors',
            signal: controller.signal,
            cache: 'no-store'
          });
          clearTimeout(timeoutId);
          return true;
        } catch (e) {
          continue;
        }
      }
      
      clearTimeout(timeoutId);
      return false;
    } catch (error) {
      console.log('Connectivity check failed:', error.message);
      return false;
    }
  }, []);

  // Handle connection restoration
  const handleConnectionRestored = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setShowSnakeGame(false);
    setConnectionStatus('online');
    
    setTimeout(async () => {
      if (isMountedRef.current) {
        await fetchCategories(true);
        console.log('Internet connection restored and data refreshed!');
      }
    }, 500);
  }, []);

  // Monitor connection status
  const monitorConnection = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    const isConnected = await checkInternetConnectivity();
    
    if (!isConnected && !showSnakeGame && connectionStatus === 'online') {
      console.log('🌐 Internet lost - showing snake game');
      setConnectionStatus('offline');
      setShowSnakeGame(true);
    } else if (isConnected && showSnakeGame) {
      console.log('✅ Internet restored - closing game');
      await handleConnectionRestored();
    } else if (isConnected && connectionStatus === 'offline') {
      setConnectionStatus('online');
    }
  }, [showSnakeGame, connectionStatus, checkInternetConnectivity, handleConnectionRestored]);

  // Start connection monitoring
  useEffect(() => {
    monitorConnection();
    
    connectionMonitorRef.current = setInterval(monitorConnection, 3000);
    
    const handleOnline = () => {
      console.log('📡 Browser online event');
      monitorConnection();
    };
    
    const handleOffline = () => {
      console.log('📡 Browser offline event');
      monitorConnection();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      if (connectionMonitorRef.current) {
        clearInterval(connectionMonitorRef.current);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [monitorConnection]);

  // Fetch categories
  const fetchCategories = useCallback(async (showLoading = false, retryAttempt = 0) => {
    if (connectionStatus === 'offline') {
      console.log('Skipping fetch - offline');
      return false;
    }
    
    if (showLoading && isMountedRef.current) {
      setLoading(true);
    }
    
    try {
      const timeoutDuration = 15000;
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
      
      if (isMountedRef.current) {
        setLocalCategories(categoriesData);
        setLastUpdate(new Date());
        setRetryCount(0);
      }
      
      return true;
    } catch (error) {
      console.error('Error fetching categories:', error);
      
      if (connectionStatus === 'offline') {
        return false;
      }
      
      if (retryAttempt < 3) {
        const delay = Math.pow(2, retryAttempt) * 1000;
        console.log(`Retrying fetch (${retryAttempt + 1}/3) in ${delay}ms...`);
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            fetchCategories(showLoading, retryAttempt + 1);
          }
        }, delay);
        
        return false;
      }
      
      return false;
    } finally {
      if (showLoading && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [connectionStatus]);

  // Auto-refresh when online
  useEffect(() => {
    if (connectionStatus === 'online') {
      fetchCategories(true);
      
      intervalRef.current = setInterval(() => {
        if (connectionStatus === 'online' && isMountedRef.current) {
          fetchCategories(false);
        }
      }, 30000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [connectionStatus, fetchCategories]);

  // Update local categories when props change
  useEffect(() => {
    if (categories && categories.length > 0) {
      setLocalCategories(categories);
    }
  }, [categories]);

  // Get last update text
  const getLastUpdateText = () => {
    if (!lastUpdate) return '';
    const seconds = Math.floor((new Date() - lastUpdate) / 1000);
    if (seconds < 60) return `Updated ${seconds}s ago`;
    if (seconds < 3600) return `Updated ${Math.floor(seconds / 60)}m ago`;
    return `Updated ${Math.floor(seconds / 3600)}h ago`;
  };

  // Three Dots Component
  const ThreeDots = () => {
    return (
      <div className="flex items-center justify-center space-x-1">
        <div className="w-2 h-2 bg-gray-600 rounded-full dot"></div>
        <div className="w-2 h-2 bg-gray-600 rounded-full dot"></div>
        <div className="w-2 h-2 bg-gray-600 rounded-full dot"></div>
      </div>
    );
  };

  // Loading spinner component with three dots animation
  const LoadingSpinner = () => {
    return (
      <div className='text-center py-12 animate-fadeIn'>
        <div className='flex flex-col items-center justify-center space-y-4'>
          <div className='relative'>
            <div className='w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-black'></div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='w-8 h-8 bg-black rounded-full animate-pulse'></div>
            </div>
          </div>
          
          {/* Loading text with three dots animation */}
          <div className='flex items-center justify-center space-x-1'>
            <p className='text-gray-500 text-sm font-medium'>
              {loadingMessage}
            </p>
            <ThreeDots />
          </div>
          
          {/* Optional progress hint */}
          <p className='text-xs text-gray-400'>
            Please wait while we fetch the latest categories
          </p>
        </div>
      </div>
    );
  };

  // Show snake game if offline
  if (showSnakeGame) {
    return <SnakeGame onConnectionRestored={handleConnectionRestored} />;
  }

  // Main render
  if (loading && localCategories.length === 0) {
    return <LoadingSpinner />;
  }

  if (!loading && localCategories.length === 0) {
    return (
      <div className='text-center py-12 animate-fadeIn'>
        <div className='inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-4'>
          <svg className='w-10 h-10 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
          </svg>
        </div>
        <p className='text-gray-500'>No categories available</p>
        <p className='text-gray-400 text-sm mt-2'>
          Please contact administrator on 0792098874
        </p>
        <button
          onClick={() => fetchCategories(true)}
          className='mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all'
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className='animate-fadeIn'>
      {/* Status Bar */}
      <div className='flex justify-between items-center mb-4 px-2'>
        {lastUpdate && (
          <div className='text-xs text-gray-400'>
            {getLastUpdateText()}
          </div>
        )}
        
        {/* Connection status indicator */}
        <div className='flex items-center space-x-2'>
          {connectionStatus === 'online' && (
            <div className='flex items-center space-x-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
              <span>Connected</span>
            </div>
          )}
          
          {connectionStatus === 'offline' && (
            <div className='flex items-center space-x-1 text-red-600 text-xs bg-red-50 px-2 py-1 rounded-full'>
              <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
              <span>Offline</span>
            </div>
          )}
          
          {/* Refresh button */}
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
      </div>
      
      <h2 className='text-2xl font-semibold text-black mb-6 text-center'>
        Select Category
      </h2>
      
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {localCategories.map((category, index) => (
          <button
            key={category._id || category.id || index}
            onClick={() => onSelectCategory(category)}
            className='group p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all text-left hover:scale-105 transform duration-200 animate-slideIn'
            style={{ 
              animationDelay: `${index * 50}ms`,
              opacity: 0 
            }}
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
    </div>
  );
};

export default CategorySelector;
