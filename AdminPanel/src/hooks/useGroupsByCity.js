import { useState, useEffect, useRef } from 'react';
import { fetchGroupsByCity } from '../services/apiService';
import { SPORT_TYPES } from '../constants/sportTypes';

const useGroupsByCity = (cityId, filterBy) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!cityId) {
      setLoading(false);
      return;
    }

    const fetchGroups = async () => {
      try {
        setLoading(true);
        const data = await fetchGroupsByCity(cityId, filterBy, abortControllerRef.current.signal);
        
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
          console.error("Fetch error:", error);
          setError(`Failed to load groups: ${error.message}`);
          setGroups([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cityId, filterBy]);

  return { cityGroups: groups, cityGroupsLoading: loading, cityGroupsError: error };
};

export default useGroupsByCity;