import { useState, useEffect, useRef } from 'react';
import { fetchGroupsByCity } from '../../services/idOfCity';
import {useAuth} from '../../hooks/useAuth'
const useGroupSearch = (cityId, searchTerm, sortBy = 'name', page, pageSize = 10) => {
  const [groups, setGroups] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const { currentUser } = useAuth();
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      console.log('Aborting previous request'); 
      abortControllerRef.current.abort();
    }
    if ((searchTerm && searchTerm.trim().length < 2) || !cityId) {
      setGroups([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
		console.log('Making new request for:', searchTerm);
    abortControllerRef.current = new AbortController();
    const controller = abortControllerRef.current;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const token = currentUser?.token || localStorage.getItem('adminAccessToken');
        if (!token) throw new Error('Authentication required');
        const { groups: newGroups, hasMore: newHasMore } = await fetchGroupsByCity(
          cityId,
          searchTerm.trim(),
          sortBy,
          page,
          pageSize,
          token,
          controller.signal
        );
        console.log('Request completed for:', searchTerm);
        if (controller.signal.aborted) return;
        setGroups(prevGroups => page === 1 ? newGroups  : [...prevGroups, ...newGroups]);
        setHasMore(newHasMore);
        setError(null);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log('Request aborted for:', searchTerm);
          console.error("Search error:", error);
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
  }, [cityId, searchTerm, sortBy, page, pageSize, currentUser]);

  return { 
    searchedGroups: groups, 
    searchLoading: loading, 
    searchError: error, 
    searchHasMore: hasMore  
  };
};

export default useGroupSearch;