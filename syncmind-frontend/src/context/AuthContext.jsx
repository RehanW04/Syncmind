import React, { createContext, useState, useContext, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('syncmind_token'));

  // On mount, verify stored token
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error('Invalid token');
        return r.json();
      })
      .then(data => setUser(data.user))
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem('syncmind_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Login failed' };
      localStorage.setItem('syncmind_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch {
      return { error: 'Cannot connect to server. Please ensure backend is running.' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Registration failed' };
      localStorage.setItem('syncmind_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch {
      return { error: 'Cannot connect to server. Please ensure backend is running.' };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Failed to update profile' };
      setUser(data.user);
      return data;
    } catch {
      return { error: 'Cannot connect to server. Please ensure backend is running.' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Failed to change password' };
      return data;
    } catch {
      return { error: 'Cannot connect to server. Please ensure backend is running.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('syncmind_token');
    setToken(null);
    setUser(null);
  };

  // Helper to get auth header for API calls
  const getAuthHeader = () => token ? { 'Authorization': `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateProfile, changePassword, loading, getAuthHeader }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
