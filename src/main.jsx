import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Add connection monitoring for snake game
const initConnectionMonitoring = () => {
  // Dispatch custom events for connection changes
  window.dispatchEvent(new CustomEvent('connection-status', { 
    detail: { status: navigator.onLine ? 'online' : 'offline' } 
  }));

  const handleOnline = () => {
    console.log('🌐 Browser online');
    window.dispatchEvent(new CustomEvent('connection-status', { 
      detail: { status: 'online' } 
    }));
  };

  const handleOffline = () => {
    console.log('🌐 Browser offline');
    window.dispatchEvent(new CustomEvent('connection-status', { 
      detail: { status: 'offline' } 
    }));
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Check connection quality
  if ('connection' in navigator) {
    const connection = navigator.connection;
    const handleConnectionChange = () => {
      const isSlow = connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g';
      window.dispatchEvent(new CustomEvent('connection-quality', { 
        detail: { 
          type: connection.effectiveType,
          isSlow: isSlow,
          downlink: connection.downlink
        } 
      }));
    };
    connection.addEventListener('change', handleConnectionChange);
    handleConnectionChange();
  }
};

// Initialize monitoring
initConnectionMonitoring();

// Render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
