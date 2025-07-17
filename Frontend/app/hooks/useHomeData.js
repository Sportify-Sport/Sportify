import { useState, useEffect, useCallback } from 'react';
import { Buffer } from 'buffer'; // For token decoding
import getApiBaseUrl from '../config/apiConfig';

export default function useHomeData(token) {
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [myEventsList, setMyEventsList] = useState([]);
  const [myGroupsList, setMyGroupsList] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [recommendationMessage, setRecommendationMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const apiUrl = getApiBaseUrl();

  // Create a reusable function to refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);

    try {
      // Extract name from token
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = parts[1];
            const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
            const decodedPayload = Buffer.from(normalizedPayload, 'base64').toString();
            const claims = JSON.parse(decodedPayload);
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
      const recommendationsResponse = await fetch(`${apiUrl}/api/Events/recommendations?count=5`, { headers });

      // Check if response is empty or not JSON
      if (recommendationsResponse.status === 204) {
        console.warn('Recommendations API returned no content (204)');
        setRecommendedEvents([]);
        setRecommendationMessage('No recommendations available');
        return;
      }
      if (!recommendationsResponse.ok) {
        console.error(`Recommendations API error: ${recommendationsResponse.status} ${recommendationsResponse.statusText}`);
        throw new Error(`Failed to fetch recommendations: ${recommendationsResponse.status}`);
      }

      // Check Content-Type to ensure it's JSON
      const contentType = recommendationsResponse.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Recommendations API did not return JSON:', contentType);
        throw new Error('Invalid response format from recommendations API');
      }

      const recommendationsJson = await recommendationsResponse.json();
      if (recommendationsJson.success && Array.isArray(recommendationsJson.data)) {
        setRecommendedEvents(recommendationsJson.data);
        setRecommendationMessage(recommendationsJson.message || 'No recommendation message provided');
      } else {
        console.warn('Recommendations API returned invalid data:', recommendationsJson);
        setRecommendedEvents([]);
        setRecommendationMessage('Failed to load recommendations');
      }

      // Fetch user-specific data if logged in
      if (token) {
        const [eventsResponse, groupsResponse] = await Promise.all([
          fetch(`${apiUrl}/api/Users/events/paginated?pageSize=4`, { headers }),
          fetch(`${apiUrl}/api/Users/groups/top4`, { headers })
        ]);

        // Events
        if (eventsResponse.status === 204) {
          console.warn('Events API returned no content (204)');
          setMyEventsList([]);
        } else if (!eventsResponse.ok) {
          console.error(`Events API error: ${eventsResponse.status} ${eventsResponse.statusText}`);
          throw new Error(`Failed to fetch events: ${eventsResponse.status}`);
        } else {
          const eventsContentType = eventsResponse.headers.get('Content-Type');
          if (!eventsContentType || !eventsContentType.includes('application/json')) {
            console.error('Events API did not return JSON:', eventsContentType);
            throw new Error('Invalid response format from events API');
          }
          const eventsJson = await eventsResponse.json();
          if (eventsJson.success && Array.isArray(eventsJson.data)) {
            setMyEventsList(eventsJson.data);
          } else {
            console.warn('Events API returned invalid data:', eventsJson);
            setMyEventsList([]);
          }
        }

        // Groups
        if (groupsResponse.status === 204) {
          console.warn('Groups API returned no content (204)');
          setMyGroupsList([]);
        } else if (!groupsResponse.ok) {
          console.error(`Groups API error: ${groupsResponse.status} ${groupsResponse.statusText}`);
          throw new Error(`Failed to fetch groups: ${groupsResponse.status}`);
        } else {
          const groupsContentType = groupsResponse.headers.get('Content-Type');
          if (!groupsContentType || !groupsContentType.includes('application/json')) {
            console.error('Groups API did not return JSON:', groupsContentType);
            throw new Error('Invalid response format from groups API');
          }
          const groupsJson = await groupsResponse.json();
          if (Array.isArray(groupsJson)) {
            setMyGroupsList(groupsJson);
          } else {
            console.warn('Groups API returned invalid data:', groupsJson);
            setMyGroupsList([]);
          }
        }
      } else {
        // Reset user data if not logged in
        setMyEventsList([]);
        setMyGroupsList([]);
      }
    } catch (error) {
      console.error('Error fetching home data:', error.message);
      setRecommendationMessage('Error loading recommendations');
      setRecommendedEvents([]);
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
    refreshData
  };
}