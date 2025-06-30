import { useState, useEffect, useRef } from 'react';
import { fetchDataByCity } from '../../services/idOfCity';
import { useAuth } from '../useAuth';

const useEventsByCity = (cityId, sortBy = 'name', page, pageSize = 4) => {
  const [events, setEvents] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const numericCityId = parseInt(cityId, 10);
    if (!numericCityId || isNaN(numericCityId)) {
      setEvents([]);
      setLoading(false);
      setHasMore(false);
      setError('Invalid city ID');
      return;
    }

    const fetchEvents = async () => {
      abortControllerRef.current = new AbortController();
      try {
        setLoading(true);
        setError(null);
        const token = currentUser?.token || localStorage.getItem('adminAccessToken');
        if (!token) {
          throw new Error('Authentication token missing');
        }
        const { events: newEvents, hasMore: newHasMore } = await fetchDataByCity(
          'AdminEvents',
          'events',
          numericCityId,
          '',
          sortBy,
          page,
          pageSize,
          token,
          abortControllerRef.current.signal
        );
        if (abortControllerRef.current.signal.aborted) {
          return;
        }
        setEvents((prevEvents) => (page === 1 ? newEvents : [...prevEvents, ...newEvents]));
        setHasMore(newHasMore);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
          setEvents([]);
          setHasMore(false);
          setError(error.message || 'Failed to fetch events');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cityId, sortBy, page, pageSize, currentUser]);

  return {
    cityEvents: events,
    cityEventsLoading: loading,
    cityEventsError: error,
    cityEventsHasMore: hasMore,
  };
};

export default useEventsByCity;