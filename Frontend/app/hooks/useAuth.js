import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useAuth() {
  const [token, setToken] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadToken() {
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
    }
    
    loadToken();
  }, []);

  return { token, setToken, profileName, setProfileName, loading };
}
