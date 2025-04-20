import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useAuth() {
  const [token, setToken] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);

  // Create a reusable function to load token
  const refreshAuth = useCallback(async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      setToken(savedToken);
      return savedToken;
    } catch (error) {
      console.error('Failed to load token:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load on component mount
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  return { 
    token, 
    setToken, 
    profileName, 
    setProfileName, 
    loading,
    refreshAuth // Export the refresh function 
  };
}
