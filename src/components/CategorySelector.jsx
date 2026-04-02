import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const CategorySelector = ({ categories, onSelectCategory, loading: parentLoading }) => {
  const [localCategories, setLocalCategories] = useState(categories);
  const [loading, setLoading] = useState(parentLoading);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('online');
  const [retryCount, setRetryCount] = useState(0);
  const [showSnakeGame, setShowSnakeGame] = useState(false);
  const intervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Snake Game State
  const [snake, setSnake] = useState([[10, 10]]);
  const [food, setFood] = useState([15, 15]);
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [booksEaten, setBooksEaten] = useState(0);
  const gameLoopRef = useRef(null);
  const [gameSpeed, setGameSpeed] = useState(150);
  const [waitingForConnection, setWaitingForConnection] = useState(false);
  const [connectionCheckInterval, setConnectionCheckInterval] = useState(null);

  const GRID_SIZE = 20;
  const CELL_SIZE = 20;

  // Book icons for different food types
  const bookIcons = ['📚', '📖', '📘', '📙', '📗', '📕', '📓', '📒'];

  // Check actual internet connectivity
  const checkInternetConnectivity = useCallback(async () => {
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
  }, []);

  // Generate random food position
  const generateRandomFood = useCallback(() => {
    const newFood = [
      Math.floor(Math.random() * GRID_SIZE),
      Math.floor(Math.random() * GRID_SIZE)
    ];
    
    // Check if food spawns on snake
    const isOnSnake = snake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1]);
    
    if (isOnSnake) {
      return generateRandomFood();
    }
    
    return newFood;
  }, [snake]);

  // Get random book icon
  const getRandomBookIcon = () => {
    return bookIcons[Math.floor(Math.random() * bookIcons.length)];
  };

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = newSnake[newSnake.length - 1];
      let newHead;

      switch (direction) {
        case 'RIGHT':
          newHead = [head[0] + 1, head[1]];
          break;
        case 'LEFT':
          newHead = [head[0] - 1, head[1]];
          break;
        case 'UP':
          newHead = [head[0], head[1] - 1];
          break;
        case 'DOWN':
          newHead = [head[0], head[1] + 1];
          break;
        default:
          return prevSnake;
      }

      // Check wall collision
      if (newHead[0] < 0 || newHead[0] >= GRID_SIZE || newHead[1] < 0 || newHead[1] >= GRID_SIZE) {
        setGameOver(true);
        stopGame();
        return prevSnake;
      }

      // Check if food is eaten
      const isEating = newHead[0] === food[0] && newHead[1] === food[1];

      if (isEating) {
        // Add new head and keep tail (grow)
        newSnake.push(newHead);
        const newScore = score + 10;
        const newBooksEaten = booksEaten + 1;
        setScore(newScore);
        setBooksEaten(newBooksEaten);
        
        if (newScore > highScore) {
          setHighScore(newScore);
        }
        
        // Increase speed every 5 books
        if (newBooksEaten % 5 === 0 && gameSpeed > 80) {
          const newSpeed = gameSpeed - 10;
          setGameSpeed(newSpeed);
          
          // Restart game loop with new speed
          if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
            gameLoopRef.current = setInterval(moveSnake, newSpeed);
          }
        }
        
        setFood(generateRandomFood());
        return newSnake;
      } else {
        // Check self collision
        const collision = newSnake.some(segment => segment[0] === newHead[0] && segment[1] === newHead[1]);
        if (collision) {
          setGameOver(true);
          stopGame();
          return prevSnake;
        }
        
        // Move snake: add new head, remove tail
        newSnake.push(newHead);
        newSnake.shift();
        return newSnake;
      }
    });
  }, [direction, food, score, booksEaten, highScore, gameSpeed, gameOver, generateRandomFood, moveSnake]);

  // Start game loop
  const startGame = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    gameLoopRef.current = setInterval(moveSnake, gameSpeed);
  }, [moveSnake, gameSpeed]);

  // Stop game loop
  const stopGame = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    setSnake([[10, 10]]);
    setFood([15, 15]);
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setBooksEaten(0);
    setGameSpeed(150);
    stopGame();
    startGame();
  }, [startGame, stopGame]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showSnakeGame || gameOver) return;
      
      const key = e.key;
      const newDirection = {
        'ArrowUp': 'UP',
        'ArrowDown': 'DOWN',
        'ArrowLeft': 'LEFT',
        'ArrowRight': 'RIGHT'
      }[key];
      
      if (newDirection) {
        e.preventDefault();
        
        // Prevent 180-degree turns
        if (
          (newDirection === 'UP' && direction !== 'DOWN') ||
          (newDirection === 'DOWN' && direction !== 'UP') ||
          (newDirection === 'LEFT' && direction !== 'RIGHT') ||
          (newDirection === 'RIGHT' && direction !== 'LEFT')
        ) {
          setDirection(newDirection);
        }
      }
      
      // Space bar to restart
      if (key === ' ' && gameOver) {
        resetGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showSnakeGame, gameOver, direction, resetGame]);

  // Monitor connection for snake game
  const monitorConnection = useCallback(async () => {
    const isConnected = await checkInternetConnectivity();
    
    if (!isConnected && !showSnakeGame && connectionStatus === 'online') {
      // Internet lost - show snake game
      setConnectionStatus('offline');
      setShowSnakeGame(true);
      setWaitingForConnection(true);
      resetGame();
    } else if (isConnected && showSnakeGame) {
      // Internet restored - close game and refresh data
      setConnectionStatus('online');
      setShowSnakeGame(false);
      setWaitingForConnection(false);
      stopGame();
      
      // Show success message and refresh
      if (window.toastMessage) {
        // You can implement a toast notification here
        console.log('Internet restored! Refreshing categories...');
      }
      
      // Refresh categories
      await fetchCategories(true);
    } else if (isConnected && connectionStatus === 'offline') {
      setConnectionStatus('online');
    }
  }, [showSnakeGame, connectionStatus, checkInternetConnectivity, resetGame, stopGame]);

  // Start connection monitoring
  useEffect(() => {
    const interval = setInterval(monitorConnection, 2000); // Check every 2 seconds
    setConnectionCheckInterval(interval);
    
    return () => {
      clearInterval(interval);
      if (connectionCheckInterval) clearInterval(connectionCheckInterval);
    };
  }, [monitorConnection]);

  // Fetch categories with retry logic
  const fetchCategories = async (showLoading = false, retryAttempt = 0) => {
    if (connectionStatus === 'offline') {
      return false;
    }
    
    if (showLoading) setLoading(true);
    
    try {
      const timeoutDuration = 10000;
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
      
      return true;
    } catch (error) {
      console.error('Error fetching categories:', error);
      
      if (retryAttempt < 3) {
        const delay = Math.pow(2, retryAttempt) * 1000;
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchCategories(showLoading, retryAttempt + 1);
        }, delay);
        
        return false;
      }
      
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Auto-refresh when online
  useEffect(() => {
    if (connectionStatus === 'online') {
      fetchCategories(true);
      
      intervalRef.current = setInterval(() => {
        fetchCategories(false);
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
  }, [connectionStatus]);

  // Snake Game Component
  const SnakeGame = () => {
    const canvasRef = useRef(null);

    // Draw game
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      
      // Draw grid
      ctx.strokeStyle = '#16213e';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
        ctx.stroke();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
        ctx.stroke();
      }
      
      // Draw food (book)
      const [foodX, foodY] = food;
      const bookIcon = getRandomBookIcon();
      ctx.font = `${CELL_SIZE}px Arial`;
      ctx.fillStyle = '#e94560';
      ctx.fillText(bookIcon, foodX * CELL_SIZE, (foodY + 1) * CELL_SIZE);
      
      // Draw snake (graduated color from head to tail)
      snake.forEach((segment, index) => {
        const [x, y] = segment;
        const isHead = index === snake.length - 1;
        
        if (isHead) {
          // Snake head
          ctx.fillStyle = '#0f3460';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
          
          // Draw eyes
          ctx.fillStyle = 'white';
          const eyeSize = 3;
          if (direction === 'RIGHT') {
            ctx.fillRect(x * CELL_SIZE + CELL_SIZE - 6, y * CELL_SIZE + 4, eyeSize, eyeSize);
            ctx.fillRect(x * CELL_SIZE + CELL_SIZE - 6, y * CELL_SIZE + CELL_SIZE - 8, eyeSize, eyeSize);
          } else if (direction === 'LEFT') {
            ctx.fillRect(x * CELL_SIZE + 3, y * CELL_SIZE + 4, eyeSize, eyeSize);
            ctx.fillRect(x * CELL_SIZE + 3, y * CELL_SIZE + CELL_SIZE - 8, eyeSize, eyeSize);
          } else if (direction === 'UP') {
            ctx.fillRect(x * CELL_SIZE + 4, y * CELL_SIZE + 3, eyeSize, eyeSize);
            ctx.fillRect(x * CELL_SIZE + CELL_SIZE - 8, y * CELL_SIZE + 3, eyeSize, eyeSize);
          } else {
            ctx.fillRect(x * CELL_SIZE + 4, y * CELL_SIZE + CELL_SIZE - 6, eyeSize, eyeSize);
            ctx.fillRect(x * CELL_SIZE + CELL_SIZE - 8, y * CELL_SIZE + CELL_SIZE - 6, eyeSize, eyeSize);
          }
        } else {
          // Snake body with gradient
          const gradient = ctx.createLinearGradient(
            x * CELL_SIZE, y * CELL_SIZE,
            x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE + CELL_SIZE
          );
          gradient.addColorStop(0, '#533483');
          gradient.addColorStop(1, '#3b2e5e');
          ctx.fillStyle = gradient;
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
        }
      });
      
      // Draw game over overlay
      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GRID_SIZE * CELL_SIZE / 2, GRID_SIZE * CELL_SIZE / 2 - 20);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#e94560';
        ctx.fillText('Press SPACE to restart', GRID_SIZE * CELL_SIZE / 2, GRID_SIZE * CELL_SIZE / 2 + 20);
        
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Arial';
        ctx.fillText(`Books Eaten: ${booksEaten}`, GRID_SIZE * CELL_SIZE / 2, GRID_SIZE * CELL_SIZE / 2 + 60);
      }
    }, [snake, food, gameOver, booksEaten, direction]);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 animate-fadeIn">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 shadow-2xl">
          {/* Game Header */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="text-4xl animate-bounce">🐍</div>
              <h2 className="text-3xl font-bold text-white">Snake Book Hunter</h2>
              <div className="text-4xl animate-bounce">📚</div>
            </div>
            
            <div className="flex justify-between items-center mb-4 px-4">
              <div className="bg-purple-900 rounded-lg px-4 py-2">
                <p className="text-purple-300 text-sm">Score</p>
                <p className="text-white text-2xl font-bold">{score}</p>
              </div>
              <div className="bg-yellow-900 rounded-lg px-4 py-2">
                <p className="text-yellow-300 text-sm">High Score</p>
                <p className="text-white text-2xl font-bold">{highScore}</p>
              </div>
              <div className="bg-blue-900 rounded-lg px-4 py-2">
                <p className="text-blue-300 text-sm">Books Eaten</p>
                <p className="text-white text-2xl font-bold">{booksEaten}</p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="mb-4 inline-flex items-center space-x-2 bg-red-900 bg-opacity-50 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-red-300 text-sm">Waiting for internet connection...</p>
            </div>
          </div>
          
          {/* Game Canvas */}
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="border-2 border-purple-500 rounded-lg mx-auto shadow-lg"
            style={{ display: 'block' }}
          />
          
          {/* Instructions */}
          <div className="mt-6 text-center text-gray-400 text-sm">
            <div className="flex justify-center space-x-6">
              <span>⬆️ ⬇️ ⬅️ ➡️</span>
              <span>Eat 📚 to restore connection!</span>
            </div>
            <p className="mt-2 text-xs">
              The snake eats books until internet returns. Each book brings you closer to reconnection!
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Loading Spinner
  const LoadingSpinner = () => (
    <div className='text-center py-12 animate-fadeIn'>
      <div className='flex flex-col items-center justify-center space-y-4'>
        <div className='relative'>
          <div className='w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-black'></div>
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='w-8 h-8 bg-black rounded-full animate-pulse'></div>
          </div>
        </div>
        <p className='text-gray-500 text-sm font-medium'>Loading categories...</p>
      </div>
    </div>
  );

  // Update parent categories
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const getLastUpdateText = () => {
    if (!lastUpdate) return '';
    const seconds = Math.floor((new Date() - lastUpdate) / 1000);
    if (seconds < 60) return `Updated ${seconds}s ago`;
    if (seconds < 3600) return `Updated ${Math.floor(seconds / 60)}m ago`;
    return `Updated ${Math.floor(seconds / 3600)}h ago`;
  };

  // Show snake game if offline
  if (showSnakeGame) {
    return <SnakeGame />;
  }

  // Main component render
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
        <button
          onClick={() => fetchCategories(true)}
          className='mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800'
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className='animate-fadeIn'>
      <div className='flex justify-between items-center mb-4 px-2'>
        {lastUpdate && (
          <div className='text-xs text-gray-400'>{getLastUpdateText()}</div>
        )}
        <button
          onClick={() => fetchCategories(true)}
          disabled={loading}
          className='text-xs text-gray-400 hover:text-gray-600 transition flex items-center space-x-1'
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
      
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {localCategories.map((category, index) => (
          <button
            key={category._id || category.id || index}
            onClick={() => onSelectCategory(category)}
            className='group p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all text-left hover:scale-105 transform duration-200'
            style={{ animation: `slideIn 0.3s ease-out ${index * 50}ms forwards`, opacity: 0 }}
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
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }
  
  .animate-bounce {
    animation: bounce 1s infinite;
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

document.head.appendChild(style);

export default CategorySelector;
