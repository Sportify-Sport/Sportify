import { useState, useEffect, useRef } from 'react';
import { fetchGroupsByCity } from '../../services/idOfCity';
import { SPORT_TYPES } from '../../constants/sportTypes';

const useGroupSearch = (cityId, searchTerm, page, pageSize = 10) => {
  const [groups, setGroups] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (!searchTerm.trim() || searchTerm.trim().length < 2 || !cityId) {
      setGroups([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
		
    abortControllerRef.current = new AbortController();
    const controller = abortControllerRef.current;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const { groups: newGroups, hasMore: newHasMore } = await fetchGroupsByCity(
          cityId,
          searchTerm.trim(),
          page,
          pageSize,
          controller.signal
        );
        if (controller.signal.aborted) return;
        const transformedData = newGroups.map(group => ({
          groupId: group.groupId || group.id,
          groupName: group.groupName || group.name,
          groupImage: group.groupImage || 'default_group.png',
          sportId: group.sportId,
          sportName: group.sportId ? SPORT_TYPES[group.sportId] : 'N/A',
          totalMembers: group.totalMembers || 1,
          gender: group.gender || 'N/A',
          foundedAt: group.foundedAt || group.createdAt || new Date().toISOString(),
          cityId: group.cityId
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
        if (!controller.signal.aborted) {
        setLoading(false);
       }
      }
    }, 300);
    return () => {
      clearTimeout(debounceTimerRef.current);
      if (controller && !controller.signal.aborted) {
        controller.abort();
      }
    };
  }, [cityId, searchTerm, page, pageSize]);

  return { 
    searchedGroups: groups, 
    searchLoading: loading, 
    searchError: error, 
    searchHasMore: hasMore  
  };
};

export default useGroupSearch;