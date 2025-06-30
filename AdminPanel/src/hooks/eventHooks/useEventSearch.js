import { useState, useEffect, useRef } from 'react';
import { fetchDataByCity } from '../../services/idOfCity';
import { useAuth } from '../useAuth';

const useEventSearch = (cityId, searchTerm, sortBy = 'name', page, pageSize = 10) => {
  const [events, setEvents] = useState([]);
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
      abortControllerRef.current.abort();
    }
    if ((searchTerm && searchTerm.trim().length < 2) || !cityId) {
      setEvents([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    abortControllerRef.current = new AbortController();
    const controller = abortControllerRef.current;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const token = currentUser?.token || localStorage.getItem('adminAccessToken');
        if (!token) throw new Error('Authentication required');
        const { events: newEvents, hasMore: newHasMore } = await fetchDataByCity(
          'AdminEvents',
          'events',
          cityId,
          searchTerm.trim(),
          sortBy,
          page,
          pageSize,
          token,
          controller.signal
        );
        if (controller.signal.aborted) return;
        setEvents((prevEvents) => (page === 1 ? newEvents : [...prevEvents, ...newEvents]));
        setHasMore(newHasMore);
        setError(null);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log('Request aborted for:', searchTerm);
          console.error('Search error:', error);
          setEvents([]);
          setHasMore(false);
          setError(error.message || 'Failed to search events');
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
    searchedEvents: events,
    searchLoading: loading,
    searchError: error,
    searchHasMore: hasMore,
  };
};

export default useEventSearch;