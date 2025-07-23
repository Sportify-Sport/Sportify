import { useState, useEffect, useCallback } from 'react';
import { Buffer } from 'buffer';
import getApiBaseUrl from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';

export default function useHomeData(authToken) {
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [myEventsList, setMyEventsList] = useState([]);
  const [myGroupsList, setMyGroupsList] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [recommendationMessage, setRecommendationMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = getApiBaseUrl();
  const { isEmailVerified } = useAuth();

  const refreshData = useCallback(async () => {
    setLoading(true);

    try {
      // Decode JWT to get the user's name
      if (authToken) {
        try {
          const [ , payload ] = authToken.split('.');
          const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = Buffer.from(normalized, 'base64').toString();
          const claims = JSON.parse(decoded);
          if (claims.name) setProfileName(claims.name);
        } catch (decodeError) {
          console.error('Error decoding JWT token:', decodeError);
        }
      }

      // Fetch recommendations (header only if verified)
      const recommendationHeaders =
        authToken && isEmailVerified
          ? { Authorization: `Bearer ${authToken}` }
          : {};

      const recommendationResponse = await fetch(
        `${apiBaseUrl}/api/Events/recommendations?count=5`,
        { headers: recommendationHeaders }
      );

      let recommendationData;
      if (recommendationResponse.status === 204) {
        setRecommendedEvents([]);
        setRecommendationMessage('No recommendations available');
      } else if (!recommendationResponse.ok) {
        throw new Error(`Recommendations API error: ${recommendationResponse.status}`);
      } else {
        const ct = recommendationResponse.headers.get('Content-Type') || '';
        if (!ct.includes('application/json')) {
          throw new Error('Recommendations: invalid response format');
        }
        recommendationData = await recommendationResponse.json();
        // Always use the API's message
        setRecommendationMessage(recommendationData.message || '');

        if (recommendationData.success && Array.isArray(recommendationData.data)) {
          setRecommendedEvents(recommendationData.data);
        } else {
          setRecommendedEvents([]);
        }
      }

      // If logged in but not verified, override the message and skip user data
      if (authToken && !isEmailVerified) {
        setMyEventsList([]);
        setMyGroupsList([]);
        setRecommendationMessage('Personalized recommendations based on your profile');
        return;
      }

      // If logged in and verified, fetch the user's events & groups
      if (authToken && isEmailVerified) {
        const userDataHeaders = { Authorization: `Bearer ${authToken}` };

        const [eventsResponse, groupsResponse] = await Promise.all([
          fetch(
            `${apiBaseUrl}/api/Users/events/paginated?pageSize=4`,
            { headers: userDataHeaders }
          ),
          fetch(
            `${apiBaseUrl}/api/Users/groups/top4`,
            { headers: userDataHeaders }
          )
        ]);

        // Events
        if (eventsResponse.status === 204) {
          setMyEventsList([]);
        } else if (!eventsResponse.ok) {
          throw new Error(`Events API error: ${eventsResponse.status}`);
        } else {
          const eventsResult = await eventsResponse.json();
          setMyEventsList(
            eventsResult.success && Array.isArray(eventsResult.data)
              ? eventsResult.data
              : []
          );
        }

        // Groups
        if (groupsResponse.status === 204) {
          setMyGroupsList([]);
        } else if (!groupsResponse.ok) {
          throw new Error(`Groups API error: ${groupsResponse.status}`);
        } else {
          const groupsResult = await groupsResponse.json();
          setMyGroupsList(
            Array.isArray(groupsResult) ? groupsResult : []
          );
        }
      } else {
        // Not logged in
        setMyEventsList([]);
        setMyGroupsList([]);
      }

    } catch (error) {
      console.error('Error fetching home data:', error.message);
      setRecommendationMessage('Error loading data');
      setRecommendedEvents([]);
      setMyEventsList([]);
      setMyGroupsList([]);
    } finally {
      setLoading(false);
    }
  }, [authToken, apiBaseUrl, isEmailVerified]);

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
