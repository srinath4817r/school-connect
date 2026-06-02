import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const saveUserToLocalStorage = (user) => {
  try {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  } catch (e) {
    console.warn('Failed to save user to localStorage', e);
  }
};

const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const isInitialLoad = React.useRef(true);

  // Set default authorization header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    const loadUser = async () => {
      const startTime = Date.now();
      const enforceDelay = isInitialLoad.current;
      if (enforceDelay) {
        isInitialLoad.current = false;
      }

      if (!token) {
        if (enforceDelay) {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 2000 - elapsed);
          setTimeout(() => {
            setLoading(false);
          }, remaining);
        } else {
          setLoading(false);
        }
        return;
      }

      try {
        // Always fetch latest profile from backend on boot to ensure token is valid and active
        const res = await axios.get(`${API_URL}/auth/me`);
        setUser(res.data.user);
        saveUserToLocalStorage(res.data.user);
      } catch (err) {
        console.error('Failed to load user profile on boot', err.message);
        logout();
      } finally {
        if (enforceDelay) {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 2000 - elapsed);
          setTimeout(() => {
            setLoading(false);
          }, remaining);
        } else {
          setLoading(false);
        }
      }
    };

    loadUser();
  }, [token]);

  // Global Axios response interceptor to handle 401 Unauthorized errors and force logout
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data.status === 'success') {
        const { token, user: userData } = res.data;
        localStorage.setItem('token', token);
        saveUserToLocalStorage(userData);
        setToken(token);
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || err.message || 'An error occurred during login' 
      };
    }
  };

  const register = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, formData);
      if (res.data.status === 'success') {
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'An error occurred during registration'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
