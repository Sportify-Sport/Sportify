import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getApiBaseUrl from '../config/apiConfig';

export default function useSports(token) {
  const [sportsList, setSportsList] = useState([]);
  const [sportsMap, setSportsMap] = useState({});
  const apiUrl = getApiBaseUrl();
  
  useEffect(() => {
    // Try to load cached sports map first
    AsyncStorage.getItem('sportsMap').then((m) => {
      if (m) setSportsMap(JSON.parse(m));
    });
    
    // Then fetch fresh data
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    fetch(`${apiUrl}/api/Sports`, { headers })
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json)) {
          setSportsList(json);
          // build and cache map of id->name
          const map = {};
          json.forEach((s) => {
            map[s.sportId] = s.sportName;
          });
          AsyncStorage.setItem('sportsMap', JSON.stringify(map));
          setSportsMap(map);
        }
      })
      .catch((error) => console.error('Error fetching sports:', error));
  }, [token, apiUrl]);
  
  return { sportsList, sportsMap };
}
