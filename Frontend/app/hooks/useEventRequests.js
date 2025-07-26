// hooks/useEventRequests.js
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import getApiBaseUrl from '../config/apiConfig';
import useAlertNotification from './useAlertNotification';
import { getCityNameById } from '../services/locationService';

export default function useEventRequests(eventId, token, isAdmin, citiesMap, setCitiesMap, onMemberAdded) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { showAlert } = useAlertNotification();
  const pageSize = 5;
  
  const apiUrl = getApiBaseUrl();
  
  // Fetch pending requests
  const fetchRequests = useCallback(async (pageNum = 1) => {
    if (!eventId || !token || !isAdmin) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${apiUrl}/api/EventParticipants/events/${eventId}/pending-requests?page=${pageNum}&pageSize=${pageSize}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch requests: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        if (pageNum === 1) {
          setRequests(result.requests || []);
        } else {
          setRequests(prev => [...prev, ...(result.requests || [])]);
        }
        setHasMore(result.hasMore || false);
      } else {
        throw new Error(result.message || 'Failed to load join requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      showAlert(error.message || 'Failed to load join requests');
    } finally {
      setLoading(false);
    }
  }, [eventId, token, isAdmin, apiUrl, showAlert]);
  
  // Get user details
  const getUserDetails = useCallback(async (userId) => {
    if (!eventId || !token || !userId || !isAdmin) return null;
    
    try {
      const response = await fetch(
        `${apiUrl}/api/EventParticipants/events/${eventId}/pending-request-user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user details: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Get city name if cityId is present
        let cityName = 'Unknown';
        if (result.user?.cityId) {
          cityName = await getCityNameById(result.user.cityId, citiesMap, setCitiesMap);
        }
        
        return { ...result.user, cityName };
      } else {
        throw new Error(result.message || 'Failed to load user details');
      }
    } catch (error) {
      showAlert(error.message || 'Failed to load user details');
      return null;
    }
  }, [eventId, token, isAdmin, apiUrl, showAlert, citiesMap, setCitiesMap]);
  
  // Process request (approve/reject)
  const processRequest = useCallback(async (userId, approve) => {
    if (!eventId || !token || !userId || !isAdmin) return;
    
    try {
      const response = await fetch(
        `${apiUrl}/api/EventParticipants/events/${eventId}/process-request/${userId}/${approve}`,
        { 
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to process request: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Remove from requests list
        setRequests(prev => prev.filter(req => req.userId !== userId));
        
        // Show success message
        const action = approve ? 'approved' : 'rejected';
        showAlert(result.message || `Request ${action} successfully`, 'success');
        
        // If approved, notify parent to refresh members list
        if (approve && onMemberAdded) {
          onMemberAdded();
        }
      } else {
        throw new Error(result.message || `Failed to ${approve ? 'approve' : 'reject'} request`);
      }
    } catch (error) {
      showAlert(error.message || `Failed to ${approve ? 'approve' : 'reject'} request`);
    }
  }, [eventId, token, isAdmin, apiUrl, showAlert, onMemberAdded]);
  
  // Toggle show more/less
  const toggleExpand = useCallback(() => {
    if (hasMore && !expanded) {
      // Load more requests
      setPage(prev => prev + 1);
      setExpanded(true);
    } else {
      // Toggle between expanded and collapsed
      setExpanded(!expanded);
      if (expanded) {
        // Reset when collapsing
        setPage(1);
        fetchRequests(1);
      }
    }
  }, [hasMore, expanded, fetchRequests]);
  
  // Initial fetch
  useEffect(() => {
    if (eventId && token && isAdmin) {
      fetchRequests(1);
    }
  }, [eventId, token, isAdmin, fetchRequests]);
  
  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchRequests(page);
    }
  }, [page, fetchRequests]);
  
  return {
    requests,
    loading,
    hasMore,
    expanded,
    toggleExpand,
    getUserDetails,
    approveRequest: (userId) => processRequest(userId, true),
    rejectRequest: (userId) => processRequest(userId, false),
    refreshRequests: () => fetchRequests(1)
  };
}
