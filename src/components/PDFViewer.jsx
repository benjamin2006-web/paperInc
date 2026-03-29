import React, { useState, useEffect, useRef } from 'react';
import {
  FiDownload,
  FiX,
  FiPrinter,
  FiZoomIn,
  FiZoomOut,
  FiMaximize2,
  FiMinimize2,
  FiStar,
} from 'react-icons/fi';

const PDFViewer = ({ paper, isVIP, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  const handleDownload = async () => {
    try {
      const response = await fetch(paper.pdfUrl);
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
      alert('Failed to download. Please try again.');
    }
  };

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.contentWindow.print();
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoom(100);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className='fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h3 className='font-semibold text-gray-900 truncate max-w-md'>
            {paper.filename || paper.title}
          </h3>
          <div className='flex items-center gap-1'>
            <button
              onClick={handleZoomOut}
              className='p-1.5 text-gray-600 hover:text-black transition rounded hover:bg-gray-100'
              title='Zoom Out'
            >
              <FiZoomOut className='w-4 h-4' />
            </button>
            <span className='text-xs text-gray-600 min-w-[45px] text-center'>
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className='p-1.5 text-gray-600 hover:text-black transition rounded hover:bg-gray-100'
              title='Zoom In'
            >
              <FiZoomIn className='w-4 h-4' />
            </button>
            <button
              onClick={handleZoomReset}
              className='p-1.5 text-gray-600 hover:text-black transition rounded hover:bg-gray-100'
              title='Reset Zoom'
            >
              <FiMaximize2 className='w-4 h-4' />
            </button>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className='p-1.5 text-gray-600 hover:text-black transition rounded hover:bg-gray-100'
            title='Print'
          >
            <FiPrinter className='w-5 h-5' />
          </button>

          {/* Download Button - Only for VIP users */}
          {isVIP ? (
            <button
              onClick={handleDownload}
              className='flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition'
              title='Download PDF'
            >
              <FiDownload className='w-4 h-4' />
              <span className='text-sm'>Download</span>
            </button>
          ) : (
            <div
              className='flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed'
              title='Upgrade to VIP to download'
            >
              <FiDownload className='w-4 h-4' />
              <span className='text-sm'>Download (VIP Only)</span>
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className='p-1.5 text-gray-600 hover:text-black transition rounded hover:bg-gray-100'
            title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? (
              <FiMinimize2 className='w-5 h-5' />
            ) : (
              <FiMaximize2 className='w-5 h-5' />
            )}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className='p-1.5 text-gray-600 hover:text-red-600 transition rounded hover:bg-gray-100'
            title='Close'
          >
            <FiX className='w-5 h-5' />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div
        ref={containerRef}
        className='flex-1 bg-gray-100 overflow-auto p-4'
        style={{ zoom: zoom / 100 }}
      >
        {loading && (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center'>
              <div className='w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-black mx-auto'></div>
              <p className='mt-4 text-gray-600'>Loading PDF...</p>
            </div>
          </div>
        )}
        {error && (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center text-red-600'>
              <p>Failed to load PDF</p>
              <button
                onClick={() => window.location.reload()}
                className='mt-2 px-4 py-2 bg-black text-white rounded-lg'
              >
                Retry
              </button>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={`${paper.pdfUrl}#toolbar=0&navpanes=0&statusbar=0&view=FitH`}
          title={paper.filename || paper.title}
          className='w-full h-full border-0 bg-white shadow-lg'
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
        />
      </div>

      {/* Footer Note for Free Users */}
      {!isVIP && (
        <div className='bg-yellow-50 border-t border-yellow-200 px-4 py-2 text-center'>
          <p className='text-xs text-yellow-700'>
            💡 You're viewing this paper. To download and save offline,
            <button
              onClick={() => (window.location.href = '/profile')}
              className='text-yellow-800 font-medium underline ml-1'
            >
              upgrade to VIP
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
