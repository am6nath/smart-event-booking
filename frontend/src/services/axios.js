import axios from 'axios';
import { API } from '../utils/constants';

const api = axios.create({
  baseURL: API.BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle token expiry globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const isLoginRequest = err.config.url.includes('/auth/login');

    // Only redirect if it's a 401 (Unauthorized) AND NOT the initial login attempt
    // 403 is for Forbidden - usually a permission issue, not an authentication expiry.
    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(err);
  }
);

export default api;