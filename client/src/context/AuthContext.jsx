import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('barter_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /** Persist tokens and user after a successful auth response. */
  const _persist = (data) => {
    localStorage.setItem('barter_user',          JSON.stringify(data.user));
    localStorage.setItem('barter_access_token',  data.accessToken);
    localStorage.setItem('barter_refresh_token', data.refreshToken);
    setUser(data.user);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    _persist(data);
    return data.user;
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    _persist(data);
    return data.user;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('barter_refresh_token');
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      // Best-effort — clear local state regardless
    } finally {
      localStorage.removeItem('barter_user');
      localStorage.removeItem('barter_access_token');
      localStorage.removeItem('barter_refresh_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
