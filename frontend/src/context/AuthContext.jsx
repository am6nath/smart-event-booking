// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          // Safely parse user object
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        // Clear corrupted storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Save auth data to localStorage and state
  const saveAuth = (userData, token) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  // Clear auth data from localStorage and state
  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Login user
  const login = async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      
      // Backend returns: { success, message, user, token }
      saveAuth(data.user, data.token);
      
      toast.success(data.message || 'Login successful!');
      return { success: true, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Register new user (with auto-login for better UX)
  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      
      // Backend returns: { success, message, user, token }
      // Auto-login after successful registration
      saveAuth(data.user, data.token);
      
      toast.success(data.message || 'Registration successful!');
      return { success: true, user: data.user };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    window.location.href = '/events';
  };

  // Refresh user profile from backend
  const refreshProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      if (data.user) {
        saveAuth(data.user); // Update state + localStorage
        return data.user;
      }
      return null;
    } catch (err) {
      // If profile fetch fails, user might be invalid - logout
      clearAuth();
      return null;
    }
  };

  // Update user in state + localStorage (for profile edits)
  const updateUser = (updatedUser) => {
    if (updatedUser) {
      saveAuth(updatedUser);
      return true;
    }
    return false;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    updateUser,
    // Computed helpers
    isLoggedIn: !!user,
    isAdmin: user?.role === 'admin',
    isOrganizer: user?.role === 'organizer',
    isUser: user?.role === 'user'
  };

  // Prevent rendering children until auth is initialized
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4"
           style={{ backgroundColor: 'var(--paper-bg)' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
             style={{ borderColor: 'var(--forest-700)', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--ink-400)', fontSize: '10px', fontWeight: 900,
                    letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
          Loading…
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};