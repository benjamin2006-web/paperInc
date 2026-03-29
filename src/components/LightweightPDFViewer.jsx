import { useEffect, useRef, useState } from 'react';
import { FiDownload, FiLoader, FiX, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const LightweightPDFViewer = ({ paper, isVIP, onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [useFallback, setUseFallback] = useState(false);
  const iframeRef = useRef(null);
  const loadTimeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());

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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Start loading progress simulation
  useEffect(() => {
    if (loading && !error) {
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
  }, [loading, error]);

  // Generate optimized URL for inline viewing
  const getOptimizedUrl = () => {
    const isRaw = isRawUrl(paper.pdfUrl);

    if (useFallback) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(paper.pdfUrl)}&embedded=true`;
    }

    if (isRaw) {
      // For raw URLs, add fl_attachment=0 to force inline view
      const separator = paper.pdfUrl.includes('?') ? '&' : '?';
      return `${paper.pdfUrl}${separator}fl_attachment=0`;
    }

    // For image-type PDFs - force inline view with optimizations
    return `${paper.pdfUrl}?fl_attachment=0&quality=50&dpr=0.75`;
  };

  // Handle loading timeout - reduced to 15 seconds for faster feedback
  useEffect(() => {
    if (!loading) return;

    loadTimeoutRef.current = setTimeout(() => {
      if (loading) {
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
  }, [loading, useFallback, paper.pdfUrl]);

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
    if (!useFallback) {
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
        {loading && (
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
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className='absolute inset-0 bg-white flex flex-col items-center justify-center z-10'>
            <div className='text-center max-w-xs px-4'>
              <div className='text-red-500 text-5xl mb-4'>⚠️</div>
              <p className='text-gray-800 font-medium mb-2'>
                Failed to Load PDF
              </p>
              <p className='text-sm text-gray-600 mb-4'>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className='px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm'
              >
                Retry
              </button>
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
          style={{ display: loading ? 'none' : 'block' }}
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
