import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session data
    const storedToken = localStorage.getItem('election_token');
    const storedUser = localStorage.getItem('election_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Optionally sync profile status from backend to verify validity
      api.get('/auth/profile')
        .then((res) => {
          setUser(prev => ({ ...prev, ...res.data.profile }));
        })
        .catch(() => {
          // If profile sync fails (e.g. token expired), sign out user
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (role, credentials) => {
    let endpoint = '';
    let payload = {};

    if (role === 'voter') {
      endpoint = '/auth/login/voter';

      payload = {
        voterId: credentials.voterId,
        password: credentials.password
      };
    } else if (role === 'organizer') {
      endpoint = '/auth/login/organizer';
      payload = { 
        username: credentials.username, 
        uniqueNumber: credentials.uniqueNumber, 
        password: credentials.password 
      };
    } else if (role === 'admin') {
      endpoint = '/auth/login/admin';
      payload = { username: credentials.username, password: credentials.password };
    }

    try {
      console.log("Payload =", payload);
      const res = await api.post(endpoint, payload);
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('election_token', receivedToken);
      localStorage.setItem('election_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed. Connection error.';
      throw new Error(errorMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem('election_token');
    localStorage.removeItem('election_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
