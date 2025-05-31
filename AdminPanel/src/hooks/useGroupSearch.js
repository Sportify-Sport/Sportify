import { useState, useEffect, useRef } from 'react';
import { searchGroups } from '../services/apiService';
import { SPORT_TYPES } from '../constants/sportTypes';

const useGroupSearch = (cityId, searchTerm, page, pageSize = 10) => {
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

    if (!searchTerm.trim() || searchTerm.trim().length < 2 || !cityId) {
      setGroups([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
		

    const fetchGroups = async () => {
      try {
        setLoading(true);
        const { groups: newGroups, hasMore: newHasMore } = await searchGroups(
          cityId,
          searchTerm.trim(),
          page,
          pageSize,
          abortControllerRef.current.signal
        );
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
          console.error("Search error:", error);
          setError(`Search failed: ${error.message}`);
          setGroups([]);
           setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    };
    const timeoutId = setTimeout(fetchGroups, 500);
    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cityId, searchTerm, page, pageSize]);

  return { searchedGroups: groups, searchLoading: loading, searchError: error, searchHasMore: hasMore  };
};

export default useGroupSearch;