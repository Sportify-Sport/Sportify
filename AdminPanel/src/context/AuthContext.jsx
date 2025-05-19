// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import getApiBaseUrl from '../config/apiConfig';

// Create context
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if token exists and is valid on app startup
  useEffect(() => {
    const checkTokenValidity = async () => {
      const accessToken = localStorage.getItem('adminAccessToken');
      const refreshToken = localStorage.getItem('adminRefreshToken');
      
      if (!accessToken || !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        // Check if token is expired
        const tokenData = parseJwt(accessToken);
        const currentTime = Date.now() / 1000;
        
        if (tokenData.exp < currentTime) {
          // Token expired, try to refresh
          const success = await refreshAccessToken(refreshToken);
          if (!success) {
            clearAuthData();
            setLoading(false);
            return;
          }
        }
        
        // Token is valid, set user data
        setCurrentUser({
          id: tokenData.nameid,
          email: tokenData.email,
          name: tokenData.name
        });
        
        // Restore selected city if exists
        const savedCity = localStorage.getItem('selectedCity');
        if (savedCity) {
          setSelectedCity(JSON.parse(savedCity));
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Auth check failed:", err);
        clearAuthData();
        setLoading(false);
      }
    };

    checkTokenValidity();
  }, []);

  // Set up token refresh timer
  useEffect(() => {
    if (!currentUser) return;
    
    const refreshInterval = setInterval(async () => {
      const accessToken = localStorage.getItem('adminAccessToken');
      if (!accessToken) return;
      
      try {
        const tokenData = parseJwt(accessToken);
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = tokenData.exp - currentTime;
        
        // Refresh token when less than 2 minutes remain
        if (timeUntilExpiry < 120) {
          const refreshToken = localStorage.getItem('adminRefreshToken');
          if (refreshToken) {
            await refreshAccessToken(refreshToken);
          }
        }
      } catch (err) {
        console.error("Token refresh check failed:", err);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(refreshInterval);
  }, [currentUser]);

  // Set up inactivity timer
  useEffect(() => {
    if (!currentUser) return;
    
    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logout();
        alert("Your session has expired due to inactivity. Please log in again.");
      }, INACTIVITY_TIMEOUT);
    };

    // Monitor user activity
    const events = ['mousedown', 'keypress', 'mousemove', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });
    
    // Initial timer setup
    resetTimer();
    
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [currentUser]);

  // Refresh access token
  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/AdminAuth/admin/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      localStorage.setItem('adminAccessToken', data.accessToken);
      localStorage.setItem('adminRefreshToken', data.refreshToken);
      
      // Update user data from new token
      const userData = parseJwt(data.accessToken);
      setCurrentUser({
        id: userData.nameid,
        email: userData.email,
        name: userData.name
      });
      
      return true;
    } catch (err) {
      console.error("Token refresh failed:", err);
      clearAuthData();
      return false;
    }
  };

  // Login function
  const login = async (email, password) => {
    setError(null);
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/AdminAuth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.message || 'Login failed';
        setError(errorMessage);
        return false;
      }
      
      localStorage.setItem('adminAccessToken', data.accessToken);
      localStorage.setItem('adminRefreshToken', data.refreshToken);
      
      // Extract user data from token
      const userData = parseJwt(data.accessToken);
      setCurrentUser({
        id: userData.nameid,
        email: userData.email,
        name: userData.name
      });
      
      return true;
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error("Login failed:", err);
      return false;
    }
  };

  // Logout function
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('adminRefreshToken');
      const accessToken = localStorage.getItem('adminAccessToken');
      
      if (refreshToken && accessToken) {
        await fetch(`${getApiBaseUrl()}/api/AdminAuth/admin/revoke-token`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Refresh-Token': refreshToken
          }
        }).catch(err => console.error("Error during token revocation:", err));
      }
    } finally {
      clearAuthData();
      navigate('/login');
    }
  }, [navigate]);

  // Select city function
  const selectCity = (city) => {
    setSelectedCity(city);
    localStorage.setItem('selectedCity', JSON.stringify(city));
  };

  // Helper function to parse JWT
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error("JWT parse error:", err);
      return {};
    }
  };

  // Clear all auth data
  const clearAuthData = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('selectedCity');
    setCurrentUser(null);
    setSelectedCity(null);
  };

  const value = {
    currentUser,
    selectedCity,
    loading,
    error,
    login,
    logout,
    selectCity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
