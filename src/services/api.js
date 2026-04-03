// services/api.js
import axios from 'axios';

// Detect if running on Vercel (production) or local
const isVercel = import.meta.env.PROD && window.location.hostname.includes('vercel.app');
const API_URL = import.meta.env.VITE_API_URL || (isVercel ? '/api' : 'https://paperincbackend.onrender.com');

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Connection status event dispatcher
const dispatchConnectionEvent = (status) => {
  const event = new CustomEvent('connection-status-change', { 
    detail: { status, timestamp: Date.now() }
  });
  window.dispatchEvent(event);
  console.log(`📡 Connection event: ${status}`);
};

// Log API configuration on startup
console.log('🔧 API Configuration:', {
  baseURL: API_URL,
  environment: import.meta.env.MODE,
  isVercel: isVercel,
  timestamp: new Date().toISOString(),
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Skip URL rewriting for absolute URLs or health checks
    if (config.url.startsWith('http') || config.url.startsWith('/health')) {
      return config;
    }
    
    // Don't add /api prefix if already there or if using Vercel proxy
    if (!config.url.startsWith('/api/') && !isVercel) {
      config.url = `/api${config.url}`;
      console.log(`🔄 Rewriting URL to: ${config.url}`);
    }
    
    // Get ALL papers - use high limit
    if (config.url.includes('/papers') && 
        !config.url.includes('limit=') && 
        config.method === 'get') {
      const separator = config.url.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}limit=10000&page=1`;
      console.log(`📚 Papers request: ${config.url}`);
    }
    
    // Prevent empty URL calls
    if (!config.url || config.url === '' || config.url === '/') {
      console.error('❌ Blocked API call with empty URL');
      return Promise.reject(new Error('Invalid API endpoint - URL is empty'));
    }

    // Log API requests (only in development to reduce noise)
    if (import.meta.env.DEV) {
      console.log(`📡 API Request: ${config.method.toUpperCase()} ${config.url}`);
    }

    // Add authentication token
    const userToken = localStorage.getItem('userToken');
    const adminToken = localStorage.getItem('adminToken');
    const token = userToken || adminToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor with connection monitoring
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Handle connection/network errors
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      console.error('🌐 Network Error - Backend might be down or slow');
      
      // Check if actually offline
      if (!navigator.onLine) {
        dispatchConnectionEvent('offline');
      } else {
        // Could be CORS or backend issue
        dispatchConnectionEvent('slow');
      }
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      console.log(`🔒 401 Unauthorized on path: ${currentPath}`);

      if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        console.log('Redirecting to admin login...');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/admin/login';
      }
      else if (currentPath === '/profile') {
        console.log('Redirecting to user login...');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
      else if (
        !currentPath.startsWith('/admin') &&
        currentPath !== '/login' &&
        currentPath !== '/register'
      ) {
        console.log('Clearing user tokens and redirecting to login...');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error(`❌ 404 Not Found: ${error.config?.url}`);
    }

    return Promise.reject(error);
  },
);

// Test API connection
api.testConnection = async () => {
  try {
    // Try health endpoint first
    const response = await api.get('/health');
    console.log('✅ API connection test successful:', response.data);
    dispatchConnectionEvent('online');
    return true;
  } catch (error) {
    console.error('❌ API connection test failed:', error.message);
    
    // Try alternative endpoint
    try {
      const response = await api.get('/categories?limit=1');
      if (response.data) {
        console.log('✅ API connection test successful (via categories)');
        dispatchConnectionEvent('online');
        return true;
      }
    } catch (e) {
      console.error('❌ Alternative test also failed');
      dispatchConnectionEvent('offline');
    }
    
    return false;
  }
};

// Monitor connection status
let connectionMonitorInterval = null;

api.startConnectionMonitoring = (callback, interval = 10000) => {
  if (connectionMonitorInterval) {
    clearInterval(connectionMonitorInterval);
  }
  
  // Initial check
  api.testConnection();
  
  // Periodic checks
  connectionMonitorInterval = setInterval(async () => {
    const isConnected = await api.testConnection();
    if (callback) {
      callback(isConnected);
    }
  }, interval);
  
  return () => {
    if (connectionMonitorInterval) {
      clearInterval(connectionMonitorInterval);
    }
  };
};

api.stopConnectionMonitoring = () => {
  if (connectionMonitorInterval) {
    clearInterval(connectionMonitorInterval);
    connectionMonitorInterval = null;
  }
};

// Check if authenticated
api.isAuthenticated = () => {
  const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
  return !!token;
};

// Get user type
api.getUserType = () => {
  if (localStorage.getItem('adminToken')) return 'admin';
  if (localStorage.getItem('userToken')) return 'user';
  return null;
};

// Clear all auth data
api.clearAuth = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  console.log('🔓 All auth data cleared');
};

// Add network status listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Browser online - checking API connection');
    dispatchConnectionEvent('online');
    api.testConnection();
  });
  
  window.addEventListener('offline', () => {
    console.log('🌐 Browser offline');
    dispatchConnectionEvent('offline');
  });
}

export default api;
