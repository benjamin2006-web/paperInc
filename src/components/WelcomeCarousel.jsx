import React, { useState, useEffect } from 'react';
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiGift,
  FiStar,
  FiUsers,
} from 'react-icons/fi';

const WelcomeCarousel = ({ onClose, onRegister, onCancel }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const slides = [
    {
      icon: <FiGift className='w-12 h-12' />,
      title: 'Welcome!',
      description: 'Get access to premium exam papers and exclusive content.',
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
      description:
        'Unlimited downloads, personalized recommendations, priority support.',
      buttonText: 'Register Now',
      buttonAction: () => onRegister(),
    },
  ];

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

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-all duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleCancel}
    >
      {/* Carousel Container - Slides up from bottom with car-like animation */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{
          height: '40%',
          minHeight: '320px',
          maxHeight: '400px',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated border line at top */}
        <div className='absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-300 rounded-full mt-2'></div>

        <div className='relative h-full flex flex-col'>
          {/* Close Button */}
          <button
            onClick={handleCancel}
            className='absolute top-4 right-4 text-gray-400 hover:text-black transition z-10 bg-white rounded-full p-1'
          >
            <FiX className='w-5 h-5' />
          </button>

          {/* Slides */}
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
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div className='text-center'>
                  <div className='flex justify-center mb-4 text-black transform transition-transform duration-500 hover:scale-110'>
                    {slide.icon}
                  </div>
                  <h2 className='text-xl font-bold text-black mb-2 animate-fadeIn'>
                    {slide.title}
                  </h2>
                  <p className='text-gray-600 mb-5 text-sm animate-fadeInUp'>
                    {slide.description}
                  </p>
                  <button
                    onClick={slide.buttonAction}
                    className='px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium text-sm transform hover:scale-105 active:scale-95'
                  >
                    {slide.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className='flex justify-center gap-3 pb-5'>
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

          {/* Navigation Arrows */}
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

          {/* Cancel/Maybe Later Button */}
          <div className='absolute bottom-16 left-0 right-0 text-center'>
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
  );
};

export default WelcomeCarousel;
