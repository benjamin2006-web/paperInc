import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiGift,
  FiStar,
  FiUsers,
  FiShare2,
  FiCopy,
  FiCheck,
  FiMail,
  FiMessageSquare,
} from 'react-icons/fi';

const WelcomeCarousel = ({ onClose, onRegister, onCancel }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const slides = [
    {
      icon: <FiGift className='w-12 h-12' />,
      title: 'Welcome to PaperInc!',
      description: 'Get access to premium exam papers and exclusive content for free.',
      buttonText: 'Get Started',
      buttonAction: () => {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentSlide(1);
          setIsAnimating(false);
        }, 300);
      },
    },
    {
      icon: <FiStar className='w-12 h-12' />,
      title: 'Premium Benefits',
      description: 'Unlimited downloads, personalized recommendations, priority support.',
      buttonText: 'Continue',
      buttonAction: () => {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentSlide(2);
          setIsAnimating(false);
        }, 300);
      },
    },
    {
      icon: <FiUsers className='w-12 h-12' />,
      title: 'Join Our Community',
      description: 'Register now to start downloading exam papers and track your progress.',
      buttonText: 'Login / Register',
      buttonAction: () => {
        handleNavigateToLogin();
      },
      secondaryButton: {
        text: 'Share App',
        action: () => setShowShareOptions(true),
      },
    },
  ];

  const handleNavigateToLogin = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onRegister) onRegister();
      onClose();
      navigate('/login');
    }, 500);
  };

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onCancel) onCancel();
      onClose();
    }, 500);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  // Share functions
  const shareViaWhatsApp = () => {
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://wa.me/?text=Check out PaperInc! Download exam papers for free: ${url}`, '_blank');
    setShowShareOptions(false);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join PaperInc - Free Exam Papers');
    const body = encodeURIComponent(`Hi! I found this great platform for exam papers. Check it out: ${window.location.origin}\n\nDownload past papers for free!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareOptions(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setShowShareOptions(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: 'PaperInc - Exam Papers',
        text: 'Download free exam papers!',
        url: window.location.origin,
      }).catch(console.error);
    } else {
      copyLink();
    }
    setShowShareOptions(false);
  };

  return (
    <>
      {/* Main Carousel Modal */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-all duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleCancel}
      >
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white transition-all duration-700 ease-out ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
          style={{
            height: '45%',
            minHeight: '380px',
            maxHeight: '450px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className='absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-300 rounded-full mt-2'></div>

          <div className='relative h-full flex flex-col'>
            <button
              onClick={handleCancel}
              className='absolute top-4 right-4 text-gray-400 hover:text-black transition z-10 bg-white rounded-full p-1'
            >
              <FiX className='w-5 h-5' />
            </button>

            <div className='flex-1 flex items-center justify-center px-6 overflow-hidden'>
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute transition-all duration-500 ease-in-out w-full px-6 ${
                    index === currentSlide
                      ? 'opacity-100 translate-x-0 scale-100'
                      : index < currentSlide
                        ? 'opacity-0 -translate-x-full scale-95'
                        : 'opacity-0 translate-x-full scale-95'
                  }`}
                >
                  <div className='text-center'>
                    <div className='flex justify-center mb-4 text-black transform transition-transform duration-500 hover:scale-110'>
                      {slide.icon}
                    </div>
                    <h2 className='text-xl font-bold text-black mb-2'>
                      {slide.title}
                    </h2>
                    <p className='text-gray-600 mb-5 text-sm'>
                      {slide.description}
                    </p>
                    <div className='flex flex-col gap-3 items-center'>
                      <button
                        onClick={slide.buttonAction}
                        className='px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium text-sm transform hover:scale-105 active:scale-95 min-w-[160px]'
                      >
                        {slide.buttonText}
                      </button>
                      {slide.secondaryButton && (
                        <button
                          onClick={slide.secondaryButton.action}
                          className='px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium text-sm transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 min-w-[160px]'
                        >
                          <FiShare2 className='w-4 h-4' />
                          {slide.secondaryButton.text}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className='flex justify-center gap-3 pb-3'>
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => !isAnimating && setCurrentSlide(index)}
                  className={`transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-6 h-2 bg-black rounded-full'
                      : 'w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400 hover:scale-125'
                  }`}
                />
              ))}
            </div>

            {currentSlide > 0 && (
              <button
                onClick={prevSlide}
                disabled={isAnimating}
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-all duration-300 hover:scale-110 disabled:opacity-50'
              >
                <FiChevronLeft className='w-6 h-6' />
              </button>
            )}
            {currentSlide < slides.length - 1 && (
              <button
                onClick={nextSlide}
                disabled={isAnimating}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-all duration-300 hover:scale-110 disabled:opacity-50'
              >
                <FiChevronRight className='w-6 h-6' />
              </button>
            )}

            <div className='absolute bottom-12 left-0 right-0 text-center'>
              <button
                onClick={handleCancel}
                className='text-xs text-gray-400 hover:text-gray-600 transition'
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Options Modal */}
      {showShareOptions && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4'
          onClick={() => setShowShareOptions(false)}
        >
          <div
            className='bg-white rounded-xl max-w-sm w-full p-6 animate-fadeInUp'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold text-black'>Share PaperInc</h3>
              <button
                onClick={() => setShowShareOptions(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <FiX className='w-5 h-5' />
              </button>
            </div>

            <p className='text-sm text-gray-600 mb-6 text-center'>
              Share this app with friends and colleagues
            </p>

            <div className='grid grid-cols-2 gap-3 mb-6'>
              <button
                onClick={shareViaWhatsApp}
                className='flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition group'
              >
                <div className='w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition'>
                  <FiMessageSquare className='w-5 h-5' />
                </div>
                <span className='text-xs text-gray-600'>WhatsApp</span>
              </button>

              <button
                onClick={shareViaEmail}
                className='flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition group'
              >
                <div className='w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition'>
                  <FiMail className='w-5 h-5' />
                </div>
                <span className='text-xs text-gray-600'>Email</span>
              </button>

              <button
                onClick={copyLink}
                className='flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition group'
              >
                <div className='w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition'>
                  {copied ? <FiCheck className='w-5 h-5' /> : <FiCopy className='w-5 h-5' />}
                </div>
                <span className='text-xs text-gray-600'>
                  {copied ? 'Copied!' : 'Copy Link'}
                </span>
              </button>

              <button
                onClick={shareNative}
                className='flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition group'
              >
                <div className='w-10 h-10 bg-black rounded-full flex items-center justify-center text-white group-hover:scale-110 transition'>
                  <FiShare2 className='w-5 h-5' />
                </div>
                <span className='text-xs text-gray-600'>Share</span>
              </button>
            </div>

            <p className='text-xs text-gray-400 text-center'>
              Share link: <span className='font-mono'>{window.location.origin}</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default WelcomeCarousel;
