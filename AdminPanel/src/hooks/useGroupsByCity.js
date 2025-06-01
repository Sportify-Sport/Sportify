import { useState, useEffect, useRef } from 'react';
import { fetchGroupsByCity } from '../services/idOfCity';
import { SPORT_TYPES } from '../constants/sportTypes';

const useGroupsByCity = (cityId, filterBy, page, pageSize = 4) => {
  const [groups, setGroups] = useState([]);
  const [hasMore, setHasMore] = useState(false);
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
      setHasMore(false);
      return;
    }

    const fetchGroups = async () => {
      try {
        setLoading(true);
        const { groups: newGroups, hasMore: newHasMore } = await fetchGroupsByCity(
          cityId,
          filterBy,
          page,
          pageSize,
          abortControllerRef.current.signal
        );
        
        // CORRECTED: Use newGroups instead of undefined 'data'
        const transformedData = newGroups.map(group => ({
          groupId: group.groupId || group.id,
          groupName: group.groupName || group.name,
          groupImage: group.groupImage || 'default_group.png',
          sportId: group.sportId,
          sportName: group.sportId ? SPORT_TYPES[group.sportId] : 'N/A',
          totalMembers: group.totalMembers || 1,
          gender: group.gender || 'N/A',
          foundedAt: group.foundedAt || group.createdAt || new Date().toISOString()
        }));

        setGroups(prevGroups => page === 1 ? transformedData : [...prevGroups, ...transformedData]);
        setHasMore(newHasMore);
        setError(null);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Fetch error:", error);
          setError(`Failed to load groups: ${error.message}`);
          setGroups([]);
          setHasMore(false);
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
  }, [cityId, filterBy, page, pageSize]);

  return { 
    cityGroups: groups, 
    cityGroupsLoading: loading, 
    cityGroupsError: error, 
    cityGroupsHasMore: hasMore 
  };
};

export default useGroupsByCity;