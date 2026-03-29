import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiFileText,
  FiCalendar,
  FiBookOpen,
  FiEye,
  FiDownload,
  FiStar,
  FiLock,
} from 'react-icons/fi';
import LightweightPDFViewer from './LightweightPDFViewer';
import { preloadPDF } from '../utils/pdfPreloader';

const PaperCard = ({ paper, isVIP = false }) => {
  const navigate = useNavigate();
  const [showViewer, setShowViewer] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const openPDF = () => {
    // If paper is VIP only and user is not VIP, redirect to profile to upgrade
    if (paper.isVIPOnly && !isVIP) {
      const confirmUpgrade = confirm(
        'This is a VIP-only paper. You need to upgrade to VIP to access it.\n\nWould you like to upgrade now?',
      );
      if (confirmUpgrade) {
        navigate('/profile');
      }
      return;
    }
    setShowViewer(true);
  };

  // Preload PDF on hover (only if user can access it)
  const handleMouseEnter = () => {
    if (!paper.isVIPOnly || isVIP) {
      setIsHovered(true);
      preloadPDF(paper._id, paper.pdfUrl).catch(console.error);
    }
  };

  // FIXED: Download handler - use relative path instead of hardcoded localhost
  const handleDownload = async (e) => {
    e.stopPropagation();

    if (!isVIP) {
      const confirmUpgrade = confirm(
        'VIP subscription required to download papers.\n\nWould you like to upgrade to VIP?',
      );
      if (confirmUpgrade) {
        navigate('/profile');
      }
      return;
    }

    setDownloading(true);
    try {
      const token = localStorage.getItem('userToken');
      // Use relative path - API_BASE_URL will be added by axios/vite proxy
      const response = await fetch(`/api/papers/download/${paper._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Download failed');
      }

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
      alert(error.message || 'Failed to download. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const getCategoryDisplay = (category) => {
    const displayNames = {
      'L5 TVET': 'L5 TVET',
      P6: 'P6',
      'S6 ACC': 'S6 Accounting',
      'S6 ANP': 'S6 Arts & Sciences',
      'S6 GE': 'S6 General Education',
      S3: 'S3',
      'Y3 TTC': 'Y3 TTC',
    };
    return displayNames[category] || category;
  };

  const isLocked = paper.isVIPOnly && !isVIP;

  return (
    <>
      <div
        className={`group bg-white border rounded-xl p-5 transition-all duration-300 ${
          isLocked
            ? 'border-gray-200 opacity-75 hover:shadow-md'
            : 'border-gray-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 cursor-pointer'
        }`}
        onMouseEnter={handleMouseEnter}
        onClick={openPDF}
      >
        <div className='flex items-start gap-4'>
          <div className='flex-shrink-0'>
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                isLocked ? 'bg-gray-100' : 'bg-gray-100 group-hover:bg-gray-200'
              }`}
            >
              {isLocked ? (
                <FiLock className='w-6 h-6 text-gray-500' />
              ) : (
                <FiFileText className='w-6 h-6 text-gray-700' />
              )}
            </div>
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2'>
              <h3
                className={`text-lg font-semibold mb-2 line-clamp-2 flex-1 ${
                  isLocked
                    ? 'text-gray-600'
                    : 'text-gray-900 group-hover:text-black'
                }`}
              >
                {paper.filename || paper.title}
              </h3>
              {paper.isVIPOnly && (
                <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 whitespace-nowrap'>
                  <FiStar className='w-3 h-3' />
                  VIP
                </span>
              )}
            </div>

            <div className='flex flex-wrap gap-2'>
              <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                <FiBookOpen className='w-3 h-3' />
                {getCategoryDisplay(paper.category)}
              </span>
              {paper.trade && (
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                  {paper.trade}
                </span>
              )}
              <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                <FiCalendar className='w-3 h-3' />
                {paper.year}
              </span>
            </div>

            <div className='flex items-center gap-4 mt-3 pt-2 border-t border-gray-100'>
              <div
                className={`flex items-center gap-1 text-xs ${
                  isLocked
                    ? 'text-gray-400'
                    : 'text-gray-500 group-hover:text-black'
                }`}
              >
                <FiEye className='w-3 h-3' />
                {isLocked ? 'VIP Only - Upgrade to view' : 'Click to Read'}
              </div>

              {isVIP ? (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className='flex items-center gap-1 text-xs text-gray-500 hover:text-black transition disabled:opacity-50'
                >
                  <FiDownload className='w-3 h-3' />
                  {downloading ? 'Downloading...' : 'Download'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const confirmUpgrade = confirm(
                      'VIP subscription required to download papers.\n\nWould you like to upgrade to VIP?',
                    );
                    if (confirmUpgrade) {
                      navigate('/profile');
                    }
                  }}
                  className='flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-600 transition'
                >
                  <FiLock className='w-3 h-3' />
                  Upgrade to Download
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showViewer && !isLocked && (
        <LightweightPDFViewer
          paper={paper}
          isVIP={isVIP}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
};

export default PaperCard;
