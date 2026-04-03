// services/api.js - Simplified version
import axios from 'axios';

// Use the full backend URL directly
const API_URL = 'https://paperincbackend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Remove all the complex URL rewriting logic
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
