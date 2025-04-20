import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getApiBaseUrl from '../config/apiConfig';

export default function useSports(token) {
  const [sportsList, setSportsList] = useState([]);
  const [sportsMap, setSportsMap] = useState({});
  const apiUrl = getApiBaseUrl();
  
  // Create a reusable function to refresh sports data
  const refreshSports = useCallback(async () => {
    try {
      // Try to load cached sports map first
      const cached = await AsyncStorage.getItem('sportsMap');
      if (cached) setSportsMap(JSON.parse(cached));
      
      // Then fetch fresh data
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await fetch(`${apiUrl}/api/Sports`, { headers });
      const json = await response.json();
      
      if (Array.isArray(json)) {
        setSportsList(json);
        // build and cache map of id->name
        const map = {};
        json.forEach((s) => {
          map[s.sportId] = s.sportName;
        });
        await AsyncStorage.setItem('sportsMap', JSON.stringify(map));
        setSportsMap(map);
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  }, [token, apiUrl]);
  
  // Initial load on component mount
  useEffect(() => {
    refreshSports();
  }, [refreshSports]);
  
  return { 
    sportsList, 
    sportsMap,
    refreshSports 
  };
}
