import { useCallback, useEffect, useRef, useState } from 'react';

const SnakeGame = ({ onConnectionRestored, onClose }) => {
  const [snake, setSnake] = useState([[10, 10]]);
  const [food, setFood] = useState([15, 15]);
  const [direction, setDirection] = useState('RIGHT');
  const [nextDirection, setNextDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [gameWin, setGameWin] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [booksEaten, setBooksEaten] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(150);
  const gameLoopRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  
  const GRID_SIZE = 20;
  const CELL_SIZE = Math.min(20, Math.floor(window.innerWidth / 25)); // Responsive cell size
  const WIN_CONDITION = 30; // Easier win condition for casual play

  // Nature-inspired food icons
  const natureIcons = ['🍎', '🍃', '🌿', '🍓', '🍒', '🍊', '🍉', '🌰'];

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }
  }, [score, highScore]);

  const getRandomIcon = () => {
    return natureIcons[Math.floor(Math.random() * natureIcons.length)];
  };

  const generateRandomFood = useCallback(() => {
    if (booksEaten >= WIN_CONDITION) {
      setGameWin(true);
      stopGame();
      return null;
    }

    let attempts = 0;
    while (attempts < 500) {
      const newFood = [
        Math.floor(Math.random() * GRID_SIZE),
        Math.floor(Math.random() * GRID_SIZE),
      ];
      
      const isOnSnake = snake.some(
        (segment) => segment[0] === newFood[0] && segment[1] === newFood[1]
      );
      
      if (!isOnSnake) {
        return newFood;
      }
      attempts++;
    }
    
    // Find empty cell
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (!snake.some(segment => segment[0] === i && segment[1] === j)) {
          return [i, j];
        }
      }
    }
    
    setGameWin(true);
    stopGame();
    return [0, 0];
  }, [snake, booksEaten, stopGame]);

  const moveSnake = useCallback(() => {
    if (gameOver || gameWin || paused) return;

    setDirection(nextDirection);

    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = newSnake[newSnake.length - 1];
      let newHead;

      switch (nextDirection) {
        case 'RIGHT': newHead = [head[0] + 1, head[1]]; break;
        case 'LEFT': newHead = [head[0] - 1, head[1]]; break;
        case 'UP': newHead = [head[0], head[1] - 1]; break;
        case 'DOWN': newHead = [head[0], head[1] + 1]; break;
        default: return prevSnake;
      }

      // Wall collision
      if (newHead[0] < 0 || newHead[0] >= GRID_SIZE || newHead[1] < 0 || newHead[1] >= GRID_SIZE) {
        setGameOver(true);
        stopGame();
        return prevSnake;
      }

      const isEating = newHead[0] === food[0] && newHead[1] === food[1];

      if (isEating) {
        newSnake.push(newHead);
        const newScore = score + 10;
        const newBooksEaten = booksEaten + 1;
        setScore(newScore);
        setBooksEaten(newBooksEaten);

        // Gentle speed increase
        if (newBooksEaten % 8 === 0 && gameSpeed > 100) {
          const newSpeed = gameSpeed - 5;
          setGameSpeed(newSpeed);
          if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
            gameLoopRef.current = setInterval(moveSnake, newSpeed);
          }
        }

        setFood(generateRandomFood());
        return newSnake;
      } else {
        const collision = newSnake.some(
          (segment) => segment[0] === newHead[0] && segment[1] === newHead[1]
        );
        if (collision) {
          setGameOver(true);
          stopGame();
          return prevSnake;
        }

        newSnake.push(newHead);
        newSnake.shift();
        return newSnake;
      }
    });
  }, [nextDirection, food, score, booksEaten, gameSpeed, gameOver, gameWin, paused, generateRandomFood, stopGame]);

  const startGame = useCallback(() => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (!gameOver && !gameWin && !paused) {
      gameLoopRef.current = setInterval(moveSnake, gameSpeed);
    }
  }, [moveSnake, gameSpeed, gameOver, gameWin, paused]);

  const stopGame = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  const togglePause = useCallback(() => {
    if (gameOver || gameWin) return;
    setPaused(!paused);
    if (!paused) stopGame();
    else startGame();
  }, [paused, gameOver, gameWin, stopGame, startGame]);

  const resetGame = useCallback(() => {
    setSnake([[10, 10]]);
    setFood([15, 15]);
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setGameOver(false);
    setGameWin(false);
    setPaused(false);
    setScore(0);
    setBooksEaten(0);
    setGameSpeed(150);
    stopGame();
    startGame();
  }, [startGame, stopGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameWin || gameOver) {
        if (e.key === ' ' || e.key === 'Space') {
          e.preventDefault();
          resetGame();
        }
        return;
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
        return;
      }

      if (paused) return;

      const directions = {
        ArrowUp: 'UP', ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT', ArrowRight: 'RIGHT'
      };
      
      const newDir = directions[e.key];
      if (newDir) {
        e.preventDefault();
        if ((newDir === 'UP' && direction !== 'DOWN') ||
            (newDir === 'DOWN' && direction !== 'UP') ||
            (newDir === 'LEFT' && direction !== 'RIGHT') ||
            (newDir === 'RIGHT' && direction !== 'LEFT')) {
          setNextDirection(newDir);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver, gameWin, paused, direction, togglePause, resetGame]);

  // Touch controls
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || paused || gameOver || gameWin) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) return;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0 && direction !== 'LEFT') setNextDirection('RIGHT');
      else if (deltaX < 0 && direction !== 'RIGHT') setNextDirection('LEFT');
    } else {
      if (deltaY > 0 && direction !== 'UP') setNextDirection('DOWN');
      else if (deltaY < 0 && direction !== 'DOWN') setNextDirection('UP');
    }
    
    setTouchStart(null);
  };

  useEffect(() => {
    startGame();
    return () => stopGame();
  }, [startGame, stopGame]);

  // Canvas drawing - Nature theme
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const size = GRID_SIZE * CELL_SIZE;
    canvas.width = size;
    canvas.height = size;

    // Earth/nature background
    ctx.fillStyle = '#2d4a22';
    ctx.fillRect(0, 0, size, size);

    // Draw grass pattern
    ctx.fillStyle = '#3a5c2e';
    for (let i = 0; i < size; i += 20) {
      ctx.fillRect(i, 0, 2, size);
      ctx.fillRect(0, i, size, 2);
    }

    // Draw food (nature item)
    if (food) {
      const [foodX, foodY] = food;
      ctx.font = `${CELL_SIZE}px "Segoe UI Emoji"`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.fillText(getRandomIcon(), foodX * CELL_SIZE, (foodY + 1) * CELL_SIZE);
      ctx.shadowBlur = 0;
    }

    // Draw snake
    snake.forEach((segment, index) => {
      const [x, y] = segment;
      const isHead = index === snake.length - 1;
      const padding = CELL_SIZE > 15 ? 2 : 1;

      if (isHead) {
        // Snake head - gentle green
        ctx.fillStyle = '#5a8f4c';
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
        
        // Eyes
        ctx.fillStyle = '#ffffff';
        const eyeSize = Math.max(2, Math.floor(CELL_SIZE / 5));
        if (direction === 'RIGHT') {
          ctx.fillRect(x * CELL_SIZE + CELL_SIZE - eyeSize * 2, y * CELL_SIZE + eyeSize, eyeSize, eyeSize);
          ctx.fillRect(x * CELL_SIZE + CELL_SIZE - eyeSize * 2, y * CELL_SIZE + CELL_SIZE - eyeSize * 2, eyeSize, eyeSize);
        } else if (direction === 'LEFT') {
          ctx.fillRect(x * CELL_SIZE + eyeSize, y * CELL_SIZE + eyeSize, eyeSize, eyeSize);
          ctx.fillRect(x * CELL_SIZE + eyeSize, y * CELL_SIZE + CELL_SIZE - eyeSize * 2, eyeSize, eyeSize);
        } else if (direction === 'UP') {
          ctx.fillRect(x * CELL_SIZE + eyeSize, y * CELL_SIZE + eyeSize, eyeSize, eyeSize);
          ctx.fillRect(x * CELL_SIZE + CELL_SIZE - eyeSize * 2, y * CELL_SIZE + eyeSize, eyeSize, eyeSize);
        } else {
          ctx.fillRect(x * CELL_SIZE + eyeSize, y * CELL_SIZE + CELL_SIZE - eyeSize * 2, eyeSize, eyeSize);
          ctx.fillRect(x * CELL_SIZE + CELL_SIZE - eyeSize * 2, y * CELL_SIZE + CELL_SIZE - eyeSize * 2, eyeSize, eyeSize);
        }
      } else {
        // Snake body - leaf pattern
        const gradient = ctx.createLinearGradient(
          x * CELL_SIZE, y * CELL_SIZE,
          x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE + CELL_SIZE
        );
        gradient.addColorStop(0, '#4a7c3c');
        gradient.addColorStop(1, '#3a6c2c');
        ctx.fillStyle = gradient;
        ctx.fillRect(x * CELL_SIZE + padding, y * CELL_SIZE + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2);
      }
    });

    // Overlays
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(16, CELL_SIZE)}px "Segoe UI"`;
      ctx.textAlign = 'center';
      ctx.fillText('💀', size / 2, size / 2 - 20);
      ctx.font = `${Math.max(12, CELL_SIZE - 4)}px "Segoe UI"`;
      ctx.fillText('Game Over', size / 2, size / 2 + 10);
      ctx.font = `${Math.max(10, CELL_SIZE - 6)}px "Segoe UI"`;
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('Tap space to restart', size / 2, size / 2 + 40);
    }

    if (gameWin) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${Math.max(16, CELL_SIZE)}px "Segoe UI"`;
      ctx.textAlign = 'center';
      ctx.fillText('🏆', size / 2, size / 2 - 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.max(12, CELL_SIZE - 4)}px "Segoe UI"`;
      ctx.fillText('You Won!', size / 2, size / 2 + 10);
      ctx.font = `${Math.max(10, CELL_SIZE - 6)}px "Segoe UI"`;
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('Tap space to play again', size / 2, size / 2 + 40);
    }

    if (paused && !gameOver && !gameWin) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(14, CELL_SIZE - 2)}px "Segoe UI"`;
      ctx.textAlign = 'center';
      ctx.fillText('⏸', size / 2, size / 2);
      ctx.font = `${Math.max(10, CELL_SIZE - 6)}px "Segoe UI"`;
      ctx.fillText('Paused', size / 2, size / 2 + 25);
    }
  }, [snake, food, gameOver, gameWin, paused, direction, CELL_SIZE, GRID_SIZE]);

  // Connection check
  useEffect(() => {
    const checkConnection = setInterval(() => {
      if (navigator.onLine && onConnectionRestored) {
        onConnectionRestored();
        stopGame();
      }
    }, 1000);
    return () => clearInterval(checkConnection);
  }, [onConnectionRestored, stopGame]);

  // Responsive design
  const getSpeedEmoji = () => {
    if (gameSpeed >= 140) return '🐢';
    if (gameSpeed >= 120) return '🌿';
    if (gameSpeed >= 100) return '⚡';
    return '🔥';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1a3a1a 0%, #0d2a0d 100%)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full max-w-md mx-auto p-4">
        {/* Simple nature frame */}
        <div className="bg-[#2d4a22] rounded-3xl p-4 shadow-2xl border border-[#5a8f4c]">
          
          {/* Header - Minimal */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🐍</span>
              <h1 className="text-white text-xl font-bold tracking-wide" style={{ fontFamily: "'Segoe UI', system-ui" }}>
                Snake
              </h1>
              <span className="text-2xl">🌿</span>
            </div>
            
            {/* Simple stats */}
            <div className="flex justify-around gap-2">
              <div className="bg-black bg-opacity-30 rounded-xl px-3 py-1">
                <div className="text-[#8bc47a] text-xs">Score</div>
                <div className="text-white text-xl font-bold">{score}</div>
              </div>
              <div className="bg-black bg-opacity-30 rounded-xl px-3 py-1">
                <div className="text-[#8bc47a] text-xs">Best</div>
                <div className="text-white text-xl font-bold">{highScore}</div>
              </div>
              <div className="bg-black bg-opacity-30 rounded-xl px-3 py-1">
                <div className="text-[#8bc47a] text-xs">Food</div>
                <div className="text-white text-xl font-bold">{booksEaten}</div>
              </div>
            </div>
          </div>

          {/* Game Canvas */}
          <div className="flex justify-center mb-4">
            <canvas
              ref={canvasRef}
              className="rounded-xl shadow-xl"
              style={{ 
                width: '100%', 
                height: 'auto', 
                maxWidth: '400px',
                imageRendering: 'crisp-edges'
              }}
            />
          </div>

          {/* Simple Controls - Mobile friendly */}
          <div className="space-y-3">
            {/* Progress to win */}
            <div className="bg-black bg-opacity-30 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-[#8bc47a] h-full rounded-full transition-all duration-300"
                style={{ width: `${(booksEaten / WIN_CONDITION) * 100}%` }}
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={togglePause}
                className="flex-1 bg-black bg-opacity-40 rounded-xl py-2 text-white text-sm font-medium active:bg-opacity-60 transition"
              >
                {paused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              <button
                onClick={resetGame}
                className="flex-1 bg-black bg-opacity-40 rounded-xl py-2 text-white text-sm font-medium active:bg-opacity-60 transition"
              >
                🔄 New Game
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex-1 bg-black bg-opacity-40 rounded-xl py-2 text-white text-sm font-medium active:bg-opacity-60 transition"
                >
                  ✕ Close
                </button>
              )}
            </div>

            {/* Connection status */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-black bg-opacity-30 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[#8bc47a] text-xs">Waiting for internet...</span>
              </div>
            </div>

            {/* Simple instructions */}
            <div className="text-center text-[#8bc47a] text-xs">
              <div className="flex justify-center gap-4">
                <span>⬆️ ⬇️ ⬅️ ➡️</span>
                <span>🍎 Eat {WIN_CONDITION} to win</span>
                <span>{getSpeedEmoji()} {gameSpeed >= 140 ? 'Easy' : gameSpeed >= 120 ? 'Normal' : 'Fast'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
