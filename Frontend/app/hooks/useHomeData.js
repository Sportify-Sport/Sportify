import { useState, useEffect } from 'react';
import getApiBaseUrl from '../config/apiConfig';

export default function useHomeData(token) {
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [myEventsList, setMyEventsList] = useState([]);
  const [myGroupsList, setMyGroupsList] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);
  
  const apiUrl = getApiBaseUrl();
  
  // fetch public data: recommendations
  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // recommended events
    fetch(`${apiUrl}/api/Events/events/random?count=5`, { headers })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setRecommendedEvents(json.data);
        }
      })
      .catch((error) => console.error('Error fetching recommended events:', error));
  }, [token, apiUrl]);

  // fetch user-specific data and profile
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${apiUrl}/api/Users/GetUserProfile`, { headers }).then((res) => res.json()),
      fetch(`${apiUrl}/api/Users/events/paginated?pageSize=4`, { headers }).then((res) => res.json()),
      fetch(`${apiUrl}/api/Users/groups/top4`, { headers }).then((res) => res.json()),
    ])
      .then(([profileJson, eventsJson, groupsJson]) => {
        if (profileJson.firstName) {
          setProfileName(`${profileJson.firstName} ${profileJson.lastName}`);
        }
        if (eventsJson.success && Array.isArray(eventsJson.data)) {
          setMyEventsList(eventsJson.data);
        }
        if (Array.isArray(groupsJson)) {
          setMyGroupsList(groupsJson);
        }
      })
      .catch((error) => console.error('Error fetching user data:', error))
      .finally(() => setLoading(false));
  }, [token, apiUrl]);
  
  return {
    recommendedEvents,
    myEventsList,
    myGroupsList,
    profileName,
    loading,
  };
}
