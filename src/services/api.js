import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL || 'https://paperincbackend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log API configuration on startup
console.log('🔧 API Configuration:', {
  baseURL: API_URL,
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString(),
});

// Request interceptor to add auth token and log requests
api.interceptors.request.use(
  (config) => {
    // Prevent empty URL calls
    if (!config.url || config.url === '' || config.url === '/') {
      console.error('❌ Blocked API call with empty URL');
      console.trace('Empty URL call stack:');
      return Promise.reject(new Error('Invalid API endpoint - URL is empty'));
    }

    // Log all API requests
    console.log(`📡 API Request: ${config.method.toUpperCase()} ${config.url}`);
    console.log(`📡 Full URL: ${config.baseURL}${config.url}`);

    // Check for user token first, then admin token
    const userToken = localStorage.getItem('userToken');
    const adminToken = localStorage.getItem('adminToken');
    const token = userToken || adminToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔐 Auth token present: ${token.substring(0, 20)}...`);
    } else {
      console.log('🔓 No auth token found');
    }

    // Log request data for POST/PUT requests
    if (config.data && (config.method === 'post' || config.method === 'put')) {
      console.log('📦 Request data:', config.data);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(
      `✅ API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`,
    );
    return response;
  },
  (error) => {
    // Log error details
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      console.log(`🔒 401 Unauthorized on path: ${currentPath}`);

      // Check if we're on an admin page
      if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        console.log('Redirecting to admin login...');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/admin/login';
      }
      // Check if we're on a user profile page and token is invalid
      else if (currentPath === '/profile') {
        console.log('Redirecting to user login...');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
      // For other user routes, just clear tokens and redirect to login
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

    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('🌐 Network Error - Backend might not be running');
    }

    return Promise.reject(error);
  },
);

// Add a method to test the API connection
api.testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('✅ API connection test successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API connection test failed:', error.message);
    return false;
  }
};

// Add a method to check if user is authenticated
api.isAuthenticated = () => {
  const token =
    localStorage.getItem('userToken') || localStorage.getItem('adminToken');
  return !!token;
};

// Add a method to get current user type
api.getUserType = () => {
  if (localStorage.getItem('adminToken')) return 'admin';
  if (localStorage.getItem('userToken')) return 'user';
  return null;
};

// Add a method to clear all auth data
api.clearAuth = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  console.log('🔓 All auth data cleared');
};

export default api;
