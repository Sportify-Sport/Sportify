import { useState, useEffect, useCallback } from 'react';
import { Buffer } from 'buffer'; // For token decoding
import getApiBaseUrl from '../config/apiConfig';

export default function useHomeData(token) {
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [myEventsList, setMyEventsList] = useState([]);
  const [myGroupsList, setMyGroupsList] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [recommendationMessage, setRecommendationMessage] = useState('');
  const apiUrl = getApiBaseUrl();
  
  // Create a reusable function to refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Extract name from token
      if (token) {
        try {
          // Split the token into its parts
          const parts = token.split('.');
          
          if (parts.length === 3) {
            // The payload is the second part
            const payload = parts[1];
            
            // Replace characters for base64 encoding
            const normalizedPayload = payload
              .replace(/-/g, '+')
              .replace(/_/g, '/');
            
            // Decode base64
            const decodedPayload = Buffer.from(normalizedPayload, 'base64').toString();
            
            // Parse JSON
            const claims = JSON.parse(decodedPayload);
            
            // Set profile name from token
            if (claims.name) {
              setProfileName(claims.name);
            }
          }
        } catch (error) {
          console.error('Error decoding JWT token:', error);
        }
      }
      
      // Fetch recommendations
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const recommendationsResponse = await fetch(`${apiUrl}/api/Events/events/recommendations?count=5`, { headers });
      const recommendationsJson = await recommendationsResponse.json();
      if (recommendationsJson.success && Array.isArray(recommendationsJson.data)) {
        setRecommendedEvents(recommendationsJson.data);
        setRecommendationMessage(recommendationsJson.message || '');
      }
      
      // Fetch user-specific data if logged in
      if (token) {
        const [eventsResponse, groupsResponse] = await Promise.all([
          fetch(`${apiUrl}/api/Users/events/paginated?pageSize=4`, { headers }),
          fetch(`${apiUrl}/api/Users/groups/top4`, { headers })
        ]);
        
        const eventsJson = await eventsResponse.json();
        if (eventsJson.success && Array.isArray(eventsJson.data)) {
          setMyEventsList(eventsJson.data);
        }
        
        const groupsJson = await groupsResponse.json();
        if (Array.isArray(groupsJson)) {
          setMyGroupsList(groupsJson);
        }
      } else {
        // Reset user data if not logged in
        setMyEventsList([]);
        setMyGroupsList([]);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl]);
  
  // Initial load on component mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  return {
    recommendedEvents,
    myEventsList,
    myGroupsList,
    profileName,
    loading,
    recommendationMessage,
    refreshData // Export the refresh function
  };
}
