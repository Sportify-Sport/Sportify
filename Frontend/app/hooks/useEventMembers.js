// hooks/useEventMembers.js
import { useState, useEffect, useCallback } from 'react';
import getApiBaseUrl from '../config/apiConfig';
import useAlertNotification from './useAlertNotification';
import { getCityNameById } from '../services/locationService';

export default function useEventMembers(eventId, token, isAdmin, citiesMap, setCitiesMap) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { showAlert } = useAlertNotification();
  const pageSize = 5;
  
  const apiUrl = getApiBaseUrl();
  
  // Fetch event members
  const fetchMembers = useCallback(async (pageNum = 1) => {
    if (!eventId || !token) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${apiUrl}/api/EventParticipants/${eventId}/players?page=${pageNum}&pageSize=${pageSize}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        if (pageNum === 1) {
          setMembers(result.data || []);
        } else {
          setMembers(prev => [...prev, ...(result.data || [])]);
        }
        setHasMore(result.pagination?.hasMore || false);
      } else {
        throw new Error(result.message || 'Failed to load members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      showAlert(error.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [eventId, token, apiUrl, showAlert]);
  
  // Get member details
  const getMemberDetails = useCallback(async (userId) => {
    if (!eventId || !token || !userId) return null;
    
    try {
      const response = await fetch(
        `${apiUrl}/api/EventParticipants/events/${eventId}/player/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch member details: ${response.status}`);
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
        throw new Error(result.message || 'Failed to load member details');
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      showAlert(error.message || 'Failed to load member details');
      return null;
    }
  }, [eventId, token, apiUrl, showAlert, citiesMap, setCitiesMap]);
  
  // Remove member from event
  const removeMember = useCallback(async (userId) => {
    if (!eventId || !token || !userId || !isAdmin) return;
    
    try {
      const response = await fetch(
        `${apiUrl}/api/EventParticipants/${eventId}/remove-player/${userId}`,
        { 
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to remove member: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Remove member from local state
        setMembers(prev => prev.filter(member => member.userId !== userId));
        
        showAlert(result.message || 'Member removed successfully', 'success');
      } else {
        throw new Error(result.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      showAlert(error.message || 'Failed to remove member');
    }
  }, [eventId, token, isAdmin, apiUrl, showAlert]);
  
  // Toggle show more/less
  const toggleExpand = useCallback(() => {
    if (hasMore && !expanded) {
      // Load more members
      setPage(prev => prev + 1);
      setExpanded(true);
    } else {
      // Toggle between expanded and collapsed
      setExpanded(!expanded);
      if (expanded) {
        // Reset when collapsing
        setPage(1);
        fetchMembers(1);
      }
    }
  }, [hasMore, expanded, fetchMembers]);
  
  // Initial fetch when component mounts
  useEffect(() => {
    if (eventId && token && isAdmin) {
      fetchMembers(1);
    }
  }, [eventId, token, isAdmin, fetchMembers]);
  
  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchMembers(page);
    }
  }, [page, fetchMembers]);
  
  return {
    members,
    loading,
    hasMore,
    expanded,
    toggleExpand,
    getMemberDetails,
    removeMember,
    refreshMembers: () => fetchMembers(1)
  };
}
