import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  }

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await axios.get('http://localhost:5000/api/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Load user error:', err);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, [token]);

  const register = async (name, email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Registration failed' };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
