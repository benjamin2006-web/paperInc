// components/SnakeGame.jsx
import { useCallback, useEffect, useRef, useState } from 'react';

const SnakeGame = ({ onConnectionRestored, onClose }) => {
  // Game State
  const [snake, setSnake] = useState([[10, 10]]);
  const [food, setFood] = useState([15, 15]);
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [booksEaten, setBooksEaten] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(150);
  const gameLoopRef = useRef(null);
  const [currentBookIcon, setCurrentBookIcon] = useState('📚');

  const GRID_SIZE = 20;
  const CELL_SIZE = 20;

  // Book icons collection
  const bookIcons = ['📚', '📖', '📘', '📙', '📗', '📕', '📓', '📒'];

  // Get random book icon
  const getRandomBookIcon = () => {
    return bookIcons[Math.floor(Math.random() * bookIcons.length)];
  };

  // Generate random food position
  const generateRandomFood = useCallback(() => {
    const newFood = [
      Math.floor(Math.random() * GRID_SIZE),
      Math.floor(Math.random() * GRID_SIZE),
    ];

    const isOnSnake = snake.some(
      (segment) => segment[0] === newFood[0] && segment[1] === newFood[1],
    );

    if (isOnSnake) {
      return generateRandomFood();
    }

    setCurrentBookIcon(getRandomBookIcon());
    return newFood;
  }, [snake]);

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake((prevSnake) => {
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

      // Wall collision
      if (
        newHead[0] < 0 ||
        newHead[0] >= GRID_SIZE ||
        newHead[1] < 0 ||
        newHead[1] >= GRID_SIZE
      ) {
        setGameOver(true);
        stopGame();
        return prevSnake;
      }

      // Food collision
      const isEating = newHead[0] === food[0] && newHead[1] === food[1];

      if (isEating) {
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

          if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
            gameLoopRef.current = setInterval(moveSnake, newSpeed);
          }
        }

        setFood(generateRandomFood());
        return newSnake;
      } else {
        // Self collision
        const collision = newSnake.some(
          (segment) => segment[0] === newHead[0] && segment[1] === newHead[1],
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
  }, [
    direction,
    food,
    score,
    booksEaten,
    highScore,
    gameSpeed,
    gameOver,
    generateRandomFood,
  ]);

  // Start/Stop game loop
  const startGame = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    gameLoopRef.current = setInterval(moveSnake, gameSpeed);
  }, [moveSnake, gameSpeed]);

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

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) {
        if (e.key === ' ' || e.key === 'Space') {
          resetGame();
        }
        return;
      }

      const key = e.key;
      const newDirection = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
      }[key];

      if (newDirection) {
        e.preventDefault();

        if (
          (newDirection === 'UP' && direction !== 'DOWN') ||
          (newDirection === 'DOWN' && direction !== 'UP') ||
          (newDirection === 'LEFT' && direction !== 'RIGHT') ||
          (newDirection === 'RIGHT' && direction !== 'LEFT')
        ) {
          setDirection(newDirection);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver, direction, resetGame]);

  // Start game on mount
  useEffect(() => {
    startGame();
    return () => stopGame();
  }, [startGame, stopGame]);

  // Canvas drawing
  const canvasRef = useRef(null);

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
    ctx.font = `${CELL_SIZE}px Arial`;
    ctx.fillStyle = '#e94560';
    ctx.fillText(currentBookIcon, foodX * CELL_SIZE, (foodY + 1) * CELL_SIZE);

    // Draw snake
    snake.forEach((segment, index) => {
      const [x, y] = segment;
      const isHead = index === snake.length - 1;

      if (isHead) {
        // Snake head
        ctx.fillStyle = '#0f3460';
        ctx.fillRect(
          x * CELL_SIZE,
          y * CELL_SIZE,
          CELL_SIZE - 1,
          CELL_SIZE - 1,
        );

        // Draw eyes
        ctx.fillStyle = 'white';
        const eyeSize = 3;
        if (direction === 'RIGHT') {
          ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE - 6,
            y * CELL_SIZE + 4,
            eyeSize,
            eyeSize,
          );
          ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE - 6,
            y * CELL_SIZE + CELL_SIZE - 8,
            eyeSize,
            eyeSize,
          );
        } else if (direction === 'LEFT') {
          ctx.fillRect(x * CELL_SIZE + 3, y * CELL_SIZE + 4, eyeSize, eyeSize);
          ctx.fillRect(
            x * CELL_SIZE + 3,
            y * CELL_SIZE + CELL_SIZE - 8,
            eyeSize,
            eyeSize,
          );
        } else if (direction === 'UP') {
          ctx.fillRect(x * CELL_SIZE + 4, y * CELL_SIZE + 3, eyeSize, eyeSize);
          ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE - 8,
            y * CELL_SIZE + 3,
            eyeSize,
            eyeSize,
          );
        } else {
          ctx.fillRect(
            x * CELL_SIZE + 4,
            y * CELL_SIZE + CELL_SIZE - 6,
            eyeSize,
            eyeSize,
          );
          ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE - 8,
            y * CELL_SIZE + CELL_SIZE - 6,
            eyeSize,
            eyeSize,
          );
        }
      } else {
        // Snake body
        const gradient = ctx.createLinearGradient(
          x * CELL_SIZE,
          y * CELL_SIZE,
          x * CELL_SIZE + CELL_SIZE,
          y * CELL_SIZE + CELL_SIZE,
        );
        gradient.addColorStop(0, '#533483');
        gradient.addColorStop(1, '#3b2e5e');
        ctx.fillStyle = gradient;
        ctx.fillRect(
          x * CELL_SIZE,
          y * CELL_SIZE,
          CELL_SIZE - 1,
          CELL_SIZE - 1,
        );
      }
    });

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'GAME OVER',
        (GRID_SIZE * CELL_SIZE) / 2,
        (GRID_SIZE * CELL_SIZE) / 2 - 20,
      );

      ctx.font = '14px Arial';
      ctx.fillStyle = '#e94560';
      ctx.fillText(
        'Press SPACE to restart',
        (GRID_SIZE * CELL_SIZE) / 2,
        (GRID_SIZE * CELL_SIZE) / 2 + 20,
      );

      ctx.fillStyle = '#ffd700';
      ctx.font = '16px Arial';
      ctx.fillText(
        `Books Eaten: ${booksEaten}`,
        (GRID_SIZE * CELL_SIZE) / 2,
        (GRID_SIZE * CELL_SIZE) / 2 + 60,
      );
    }
  }, [snake, food, gameOver, booksEaten, direction, currentBookIcon]);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 animate-fadeIn'>
      <div className='bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 shadow-2xl'>
        {/* Game Header */}
        <div className='mb-6 text-center'>
          <div className='flex items-center justify-center space-x-4 mb-4'>
            <div className='text-4xl animate-bounce'>🐍</div>
            <h2 className='text-3xl font-bold text-white'>Snake Book Hunter</h2>
            <div className='text-4xl animate-bounce'>📚</div>
          </div>

          <div className='flex justify-between items-center mb-4 px-4 gap-4'>
            <div className='bg-purple-900 rounded-lg px-4 py-2'>
              <p className='text-purple-300 text-sm'>Score</p>
              <p className='text-white text-2xl font-bold'>{score}</p>
            </div>
            <div className='bg-yellow-900 rounded-lg px-4 py-2'>
              <p className='text-yellow-300 text-sm'>High Score</p>
              <p className='text-white text-2xl font-bold'>{highScore}</p>
            </div>
            <div className='bg-blue-900 rounded-lg px-4 py-2'>
              <p className='text-blue-300 text-sm'>Books Eaten</p>
              <p className='text-white text-2xl font-bold'>{booksEaten}</p>
            </div>
          </div>

          {/* Connection Status */}
          <div className='mb-4 inline-flex items-center space-x-2 bg-red-900 bg-opacity-50 rounded-full px-4 py-2'>
            <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
            <p className='text-red-300 text-sm'>
              Waiting for internet connection...
            </p>
          </div>
        </div>

        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className='border-2 border-purple-500 rounded-lg mx-auto shadow-lg'
          style={{ display: 'block' }}
        />

        {/* Instructions */}
        <div className='mt-6 text-center text-gray-400 text-sm'>
          <div className='flex justify-center space-x-6'>
            <span>⬆️ ⬇️ ⬅️ ➡️</span>
            <span>Eat 📚 to pass time!</span>
          </div>
          <p className='mt-2 text-xs'>
            The snake eats books until internet returns. Each book brings you
            closer to reconnection!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
