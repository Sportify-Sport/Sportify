// hooks/useEventDetails.js
import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import getApiBaseUrl from '../config/apiConfig';
import { getCityNameById } from '../services/locationService';
import useAlertNotification from './useAlertNotification';

export default function useEventDetails(eventId, token) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [citiesMap, setCitiesMap] = useState({});
  const { alert, showAlert, hideAlert } = useAlertNotification();

  const apiUrl = getApiBaseUrl();
  
  // Fetch event details
  const fetchEventDetails = useCallback(async () => {
    if (!eventId) {
      setError('No event ID provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await fetch(`${apiUrl}/api/Events/${eventId}`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch event details: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to load event');
      }
      
      const eventData = result.data;
      
      // Get city name
      const cityName = await getCityNameById(eventData.cityId, citiesMap, setCitiesMap);
      
      setEvent({
        ...eventData,
        cityName
      });
      
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.message);
      showAlert(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId, token, apiUrl, citiesMap, setCitiesMap, showAlert]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEventDetails();
  }, [fetchEventDetails]);
  
  // JOIN AS SPECTATOR
  const joinAsSpectator = useCallback(async () => {
    if (!token || !event) {
      showAlert('You need to be logged in to join events');
      return;
    }
    
    try {
      // Different endpoint based on event type
      const endpoint = event.requiresTeams 
        ? `${apiUrl}/api/EventTeams/team-events/${eventId}/join-as-spectator`
        : `${apiUrl}/api/EventParticipants/${eventId}/join/false`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setEvent(prev => ({
          ...prev,
          isParticipant: true,
          playWatch: false
        }));
        
        showAlert(result.message || 'Successfully joined as spectator', 'success');
      } else {
        showAlert(result.message || 'Failed to join event');
      }
    } catch (err) {
      console.error('Error joining as spectator:', err);
      showAlert('Network error while trying to join');
    }
  }, [token, event, eventId, apiUrl, showAlert]);
  
  // JOIN AS PLAYER
  const joinAsPlayer = useCallback(async () => {
    if (!token || !event) {
      showAlert('You need to be logged in to join events');
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/EventParticipants/${eventId}/join/true`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state to show pending request
        setEvent(prev => ({
          ...prev,
          hasPendingRequest: true
        }));
        
        showAlert(result.message || 'Join request submitted successfully', 'success');
      } else {
        showAlert(result.message || 'Failed to submit join request');
      }
    } catch (err) {
      console.error('Error requesting to join as player:', err);
      showAlert('Network error while submitting request');
    }
  }, [token, event, eventId, apiUrl, showAlert]);
  
  // CANCEL JOIN REQUEST
  const cancelRequest = useCallback(async () => {
    if (!token || !event) {
      showAlert('You need to be logged in to cancel requests');
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/EventParticipants/${eventId}/cancel-join-request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state to remove pending request
        setEvent(prev => ({
          ...prev,
          hasPendingRequest: false
        }));
        
        showAlert(result.message || 'Request canceled successfully', 'success');
      } else {
        showAlert(result.message || 'Failed to cancel request');
      }
    } catch (err) {
      console.error('Error canceling request:', err);
      showAlert('Network error while canceling request');
    }
  }, [token, event, eventId, apiUrl, showAlert]);
  
  // LEAVE EVENT
  const leaveEvent = useCallback(async () => {
    if (!token || !event) {
      showAlert('You need to be logged in to leave events');
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/EventParticipants/${eventId}/leave`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setEvent(prev => ({
          ...prev,
          isParticipant: false
        }));
        
        showAlert(result.message || 'Left event successfully', 'success');
      } else {
        showAlert(result.message || 'Failed to leave event');
      }
    } catch (err) {
      console.error('Error leaving event:', err);
      showAlert('Network error while leaving event');
    }
  }, [token, event, eventId, apiUrl, showAlert]);
  
  // CANCEL SPECTATING
  const cancelSpectating = useCallback(async () => {
    if (!token || !event) {
      showAlert('You need to be logged in to cancel spectating');
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/EventTeams/team-events/${eventId}/cancel-spectating`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setEvent(prev => ({
          ...prev,
          isParticipant: false
        }));
        
        showAlert(result.message || 'Canceled spectating successfully', 'success');
      } else {
        showAlert(result.message || 'Failed to cancel spectating');
      }
    } catch (err) {
      console.error('Error canceling spectating:', err);
      showAlert('Network error while canceling spectating');
    }
  }, [token, event, eventId, apiUrl, showAlert]);
  
  // Handle location press function (existing code)
  const handleLocationPress = useCallback(async () => {
    if (!event?.locationName) {
      Alert.alert('No location', 'Location name is not available.');
      return;
    }

    // Try geo: URI (Android → any maps; iOS → Apple Maps), fallback to Google Maps web
    const geoScheme =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${encodeURIComponent(event.locationName)}`
        : `geo:0,0?q=${encodeURIComponent(event.locationName)}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      event.locationName
    )}`;

    // choose which URL we can open
    const urlToOpen = await Linking.canOpenURL(geoScheme) ? geoScheme : webUrl;

    try {
      await Linking.openURL(urlToOpen);
    } catch (err) {
      console.error('Error opening maps:', err);
      Alert.alert(
        'Cannot open map',
        `Tried to open ${urlToOpen} but failed.`
      );
    }
  }, [event]);
  
  // Initial fetch
  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);
  
  return {
    event,
    loading,
    error,
    refreshing,
    onRefresh,
    handleLocationPress,
    alert,
    hideAlert,
    joinAsSpectator,
    joinAsPlayer,
    cancelRequest,
    leaveEvent,
    cancelSpectating,
    citiesMap,
    setCitiesMap
  };
}
