import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://statuspr.onrender.com';
const api = axios.create({ baseURL: BACKEND_URL + '/api' });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { accessToken, refreshToken } = JSON.parse(tokens);
      validateToken(accessToken, refreshToken);
    } else {
      setLoading(false);
    }
  }, []);

  async function validateToken(accessToken, refreshToken) {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(response.data);
    } catch (err) {
      if (refreshToken) {
        try {
          const refreshResponse = await api.post('/auth/refresh', { refreshToken });
          const newAccessToken = refreshResponse.data.accessToken;
          localStorage.setItem(
            'tokens',
            JSON.stringify({ accessToken: newAccessToken, refreshToken })
          );
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${newAccessToken}` },
          });
          setUser(response.data);
        } catch (refreshErr) {
          localStorage.removeItem('tokens');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function register(name, email, password, role) {
    try {
      setError(null);
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
      });
      const { accessToken, refreshToken, ...userData } = response.data;
      localStorage.setItem('tokens', JSON.stringify({ accessToken, refreshToken }));
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    }
  }

  async function login(email, password) {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, ...userData } = response.data;
      localStorage.setItem('tokens', JSON.stringify({ accessToken, refreshToken }));
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    }
  }

  async function logout() {
    try {
      const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
      await api.post('/auth/logout', { refreshToken: tokens.refreshToken });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('tokens');
      setUser(null);
    }
  }

  useEffect(() => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { accessToken } = JSON.parse(tokens);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}