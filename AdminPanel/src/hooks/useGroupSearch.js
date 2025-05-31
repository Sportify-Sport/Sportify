import { useState, useEffect, useRef } from 'react';
import { searchGroups } from '../services/apiService';
import { SPORT_TYPES } from '../constants/sportTypes';

const useGroupSearch = (cityId, searchTerm) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!searchTerm.trim() || searchTerm.trim().length < 2 || !cityId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchGroups(cityId, searchTerm.trim(), abortControllerRef.current.signal);
        
        const transformedData = data.map(group => ({
          groupId: group.groupId || group.id,
          groupName: group.groupName || group.name,
          groupImage: group.groupImage || 'default_group.png',
          sportId: group.sportId,
          sportName: group.sportId ? SPORT_TYPES[group.sportId] : 'N/A',
          totalMembers: group.totalMembers || 1,
          gender: group.gender || 'N/A',
          foundedAt: group.foundedAt || group.createdAt || new Date().toISOString()
        }));

        setGroups(transformedData);
        setError(null);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Search error:", error);
          setError(`Search failed: ${error.message}`);
          setGroups([]);
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cityId, searchTerm]);

  return { searchedGroups: groups, searchLoading: loading, searchError: error };
};

export default useGroupSearch;