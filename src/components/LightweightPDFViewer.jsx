import { useEffect, useRef, useState } from 'react';
import { FiDownload, FiLoader, FiX, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import SnakeGame from './SnakeGame';

const LightweightPDFViewer = ({ paper, isVIP, onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [useFallback, setUseFallback] = useState(false);
  const [showSnakeGame, setShowSnakeGame] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('online');
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef(null);
  const loadTimeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const connectionMonitorRef = useRef(null);
  const isMountedRef = useRef(true);

  // Helper function to detect if URL is raw upload
  const isRawUrl = (url) => {
    return (
      url && (url.includes('/raw/upload') || url.includes('resource_type=raw'))
    );
  };

  // Check if paper is VIP only and user is not VIP
  useEffect(() => {
    if (paper.isVIPOnly && !isVIP) {
      const confirmUpgrade = confirm(
        'This is a VIP-only paper. You need to upgrade to VIP to access it.\n\nWould you like to upgrade now?',
      );
      if (confirmUpgrade) {
        navigate('/profile');
      } else {
        onClose();
      }
    }
  }, [paper.isVIPOnly, isVIP, navigate, onClose]);

  // Check internet connectivity
  const checkInternetConnectivity = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Handle connection restoration
  const handleConnectionRestored = async () => {
    if (!isMountedRef.current) return;
    
    setShowSnakeGame(false);
    setConnectionStatus('online');
    
    // Reset and retry loading the PDF
    setLoading(true);
    setError(null);
    setRetryCount(0);
    setLoadProgress(0);
    
    // Refresh the iframe
    if (iframeRef.current) {
      const currentUrl = getOptimizedUrl();
      iframeRef.current.src = currentUrl;
    }
  };

  // Monitor connection status
  const monitorConnection = async () => {
    if (!isMountedRef.current) return;
    
    const isConnected = await checkInternetConnectivity();
    
    if (!isConnected && !showSnakeGame && connectionStatus === 'online') {
      // Internet lost - show snake game
      console.log('🌐 Internet lost while viewing PDF - showing snake game');
      setConnectionStatus('offline');
      setShowSnakeGame(true);
      setLoading(false); // Stop loading the PDF
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    } else if (isConnected && showSnakeGame) {
      // Internet restored - close game and reload PDF
      console.log('✅ Internet restored - reloading PDF');
      await handleConnectionRestored();
    } else if (isConnected && connectionStatus === 'offline') {
      setConnectionStatus('online');
    }
  };

  // Start connection monitoring
  useEffect(() => {
    connectionMonitorRef.current = setInterval(monitorConnection, 2000);
    
    // Also listen to browser events
    const handleOnline = () => monitorConnection();
    const handleOffline = () => monitorConnection();
    
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Start loading progress simulation
  useEffect(() => {
    if (loading && !error && !showSnakeGame && connectionStatus === 'online') {
      setLoadProgress(0);
      progressIntervalRef.current = setInterval(() => {
        setLoadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressIntervalRef.current);
            return 95;
          }
          return prev + Math.random() * 8;
        });
      }, 300);
    }
    return () => {
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
    };
  }, [loading, error, showSnakeGame, connectionStatus]);

  // Generate optimized URL for inline viewing
  const getOptimizedUrl = () => {
    const isRaw = isRawUrl(paper.pdfUrl);

    if (useFallback) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(paper.pdfUrl)}&embedded=true`;
    }

    if (isRaw) {
      const separator = paper.pdfUrl.includes('?') ? '&' : '?';
      return `${paper.pdfUrl}${separator}fl_attachment=0`;
    }

    return `${paper.pdfUrl}?fl_attachment=0&quality=50&dpr=0.75`;
  };

  // Handle loading timeout - reduced to 15 seconds for faster feedback
  useEffect(() => {
    if (!loading || showSnakeGame || connectionStatus !== 'online') return;

    loadTimeoutRef.current = setTimeout(() => {
      if (loading && !showSnakeGame) {
        if (!useFallback) {
          setUseFallback(true);
          setError('Switching to alternative viewer...');
          if (iframeRef.current) {
            iframeRef.current.src = `https://docs.google.com/viewer?url=${encodeURIComponent(paper.pdfUrl)}&embedded=true`;
          }
        } else {
          setError('Unable to load PDF. Please check your connection.');
          setLoading(false);
          if (progressIntervalRef.current)
            clearInterval(progressIntervalRef.current);
        }
      }
    }, 15000);

    return () => clearTimeout(loadTimeoutRef.current);
  }, [loading, useFallback, paper.pdfUrl, showSnakeGame, connectionStatus]);

  const handleIframeLoad = () => {
    const loadTime = Date.now() - startTimeRef.current;
    console.log(`✅ PDF loaded in ${loadTime}ms`);
    setLoadProgress(100);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setTimeout(() => {
      setLoading(false);
      setError(null);
    }, 300);
  };

  const handleIframeError = () => {
    if (!useFallback && connectionStatus === 'online') {
      setUseFallback(true);
      setError('Loading failed. Trying alternative viewer...');
      if (iframeRef.current) {
        iframeRef.current.src = `https://docs.google.com/viewer?url=${encodeURIComponent(paper.pdfUrl)}&embedded=true`;
      }
    } else {
      setError('Failed to load PDF. Please check your connection.');
      setLoading(false);
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  const handleDownload = async () => {
    if (!isVIP) {
      const confirmUpgrade = confirm(
        'VIP subscription required to download papers.\n\nWould you like to upgrade to VIP?',
      );
      if (confirmUpgrade) {
        navigate('/profile');
      }
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`/api/papers/download/${paper._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = paper.filename || paper.title || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
  };

  const currentUrl = getOptimizedUrl();

  // Get loading message based on progress
  const getLoadingMessage = () => {
    if (error) return error;
    if (loadProgress < 20) return 'Connecting to server...';
    if (loadProgress < 50) return 'Downloading document...';
    if (loadProgress < 80) return 'Rendering PDF...';
    return 'Almost ready...';
  };

  // Show snake game if offline
  if (showSnakeGame) {
    return (
      <div className='fixed inset-0 z-50'>
        <SnakeGame 
          onConnectionRestored={handleConnectionRestored}
          onClose={onClose}
        />
        {/* Close button overlay */}
        <button
          onClick={onClose}
          className='fixed top-4 right-4 z-50 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition'
        >
          <FiX className='w-5 h-5' />
        </button>
        <div className='fixed bottom-4 left-4 right-4 text-center text-white text-sm z-50 bg-black bg-opacity-50 p-2 rounded-lg'>
          🐍 Playing Snake while waiting for internet connection...
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h3 className='font-medium text-gray-900 text-sm truncate max-w-[200px]'>
            {paper.filename || paper.title}
          </h3>
          <div className='flex items-center gap-1'>
            <button
              onClick={handleZoomOut}
              className='p-1 text-gray-600 hover:text-black rounded hover:bg-gray-100 transition'
              title='Zoom Out'
            >
              <FiZoomOut className='w-4 h-4' />
            </button>
            <span className='text-xs text-gray-600 min-w-[40px] text-center'>
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className='p-1 text-gray-600 hover:text-black rounded hover:bg-gray-100 transition'
              title='Zoom In'
            >
              <FiZoomIn className='w-4 h-4' />
            </button>
          </div>
        </div>

        <div className='flex items-center gap-1'>
          {/* Connection status indicator */}
          <div className={`flex items-center gap-1 mr-2 px-2 py-1 rounded-full text-xs ${
            connectionStatus === 'online' 
              ? 'bg-green-50 text-green-600' 
              : 'bg-yellow-50 text-yellow-600'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
            }`}></div>
            <span>{connectionStatus === 'online' ? 'Online' 'Slow'}</span>
          </div>
          
          {isVIP && (
            <button
              onClick={handleDownload}
              className='p-1 text-gray-600 hover:text-black rounded hover:bg-gray-100 transition'
              title='Download'
            >
              <FiDownload className='w-4 h-4' />
            </button>
          )}
          <button
            onClick={onClose}
            className='p-1 text-gray-600 hover:text-red-600 rounded hover:bg-gray-100 transition'
          >
            <FiX className='w-5 h-5' />
          </button>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div
        className='flex-1 bg-gray-100 overflow-auto relative'
        style={{ zoom: zoom / 100 }}
      >
        {/* Loading Overlay */}
        {loading && !showSnakeGame && (
          <div className='absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center z-10'>
            <div className='text-center max-w-xs px-4'>
              <FiLoader className='w-12 h-12 text-gray-400 animate-spin mx-auto mb-4' />
              <p className='text-gray-700 font-medium mb-2'>
                {getLoadingMessage()}
              </p>

              {/* Progress Bar */}
              <div className='w-full bg-gray-200 rounded-full h-2 mb-3'>
                <div
                  className='bg-black h-2 rounded-full transition-all duration-300'
                  style={{ width: `${Math.min(loadProgress, 100)}%` }}
                />
              </div>

              {/* Percentage Indicator */}
              <p className='text-sm font-semibold text-gray-700'>
                {Math.min(Math.floor(loadProgress), 100)}%
              </p>

              <p className='text-xs text-gray-400 mt-3'>
                Please wait while the document loads...
              </p>
              
              {/* Network status note */}
              {connectionStatus === 'slow' && (
                <p className='text-xs text-yellow-600 mt-2'>
                  ⚡ Slow connection detected. Loading may take a moment...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && !showSnakeGame && (
          <div className='absolute inset-0 bg-white flex flex-col items-center justify-center z-10'>
            <div className='text-center max-w-xs px-4'>
              <div className='text-red-500 text-5xl mb-4'>⚠️</div>
              <p className='text-gray-800 font-medium mb-2'>
                Failed to Load PDF
              </p>
              <p className='text-sm text-gray-600 mb-4'>{error}</p>
              <div className='flex gap-2 justify-center'>
                <button
                  onClick={() => window.location.reload()}
                  className='px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm'
                >
                  Retry
                </button>
                <button
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    if (iframeRef.current) {
                      iframeRef.current.src = currentUrl;
                    }
                  }}
                  className='px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm'
                >
                  Reload
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Iframe */}
        <iframe
          ref={iframeRef}
          src={currentUrl}
          title={paper.filename || paper.title}
          className='w-full h-full border-0 bg-white'
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{ display: loading || showSnakeGame ? 'none' : 'block' }}
          allow='fullscreen'
        />
      </div>

      {/* Footer Note */}
      {!isVIP && (
        <div className='bg-yellow-50 border-t border-yellow-200 px-3 py-1.5 text-center'>
          <p className='text-xs text-yellow-700'>
            💡 You're viewing a preview.
            <button
              onClick={() => {
                const confirmUpgrade = confirm(
                  'Upgrade to VIP to download and access all premium content.\n\nWould you like to upgrade now?',
                );
                if (confirmUpgrade) {
                  navigate('/profile');
                }
              }}
              className='text-yellow-800 font-medium underline ml-1'
            >
              Upgrade to VIP
            </button>{' '}
            for full access
          </p>
        </div>
      )}
    </div>
  );
};

export default LightweightPDFViewer;
