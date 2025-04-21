// hooks/useEventGroups.js
import { useState, useEffect, useCallback } from 'react';
import getApiBaseUrl from '../config/apiConfig';
import useAlertNotification from './useAlertNotification';

export default function useEventGroups(eventId, token, requiresTeams) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { showAlert } = useAlertNotification();
  const pageSize = 5;
  
  const apiUrl = getApiBaseUrl();
  
  // Fetch event groups
  const fetchGroups = useCallback(async (pageNum = 1) => {
    if (!eventId || !requiresTeams) return;
    
    try {
      setLoading(true);
      // Allow non-logged in users to view groups
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await fetch(
        `${apiUrl}/api/EventTeams/team-events/${eventId}/groups?page=${pageNum}&pageSize=${pageSize}`,
        { headers }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        if (pageNum === 1) {
          setGroups(result.groups || []);
        } else {
          setGroups(prev => [...prev, ...(result.groups || [])]);
        }
        setHasMore(result.hasMore || false);
      } else {
        throw new Error(result.message || 'Failed to load groups');
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      showAlert(error.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [eventId, token, requiresTeams, apiUrl, showAlert]);
  
  // Remove group from event
  const removeGroup = useCallback(async (groupId, groupName) => {
    if (!eventId || !token || !groupId || !requiresTeams) return;
    
    try {
      const response = await fetch(
        `${apiUrl}/api/EventTeams/team-events/${eventId}/groups/${groupId}`,
        { 
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to remove group: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Remove group from local state
        setGroups(prev => prev.filter(group => group.groupId !== groupId));
        
        showAlert(result.message || `${groupName || 'Group'} removed successfully`, 'success');
      } else {
        throw new Error(result.message || 'Failed to remove group');
      }
    } catch (error) {
      console.error('Error removing group:', error);
      showAlert(error.message || 'Failed to remove group');
    }
  }, [eventId, token, requiresTeams, apiUrl, showAlert]);
  
  // Toggle show more/less
  const toggleExpand = useCallback(() => {
    if (hasMore && !expanded) {
      // Load more groups
      setPage(prev => prev + 1);
      setExpanded(true);
    } else {
      // Toggle between expanded and collapsed
      setExpanded(!expanded);
      if (expanded) {
        // Reset when collapsing
        setPage(1);
        fetchGroups(1);
      }
    }
  }, [hasMore, expanded, fetchGroups]);
  
  // Initial fetch
  useEffect(() => {
    if (eventId && requiresTeams) {
      fetchGroups(1);
    }
  }, [eventId, requiresTeams, fetchGroups]);
  
  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchGroups(page);
    }
  }, [page, fetchGroups]);
  
  return {
    groups,
    loading,
    hasMore,
    expanded,
    toggleExpand,
    removeGroup,
    refreshGroups: () => fetchGroups(1)
  };
}
