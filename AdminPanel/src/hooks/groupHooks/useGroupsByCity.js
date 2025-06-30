import { useState, useEffect, useRef } from 'react';
import { fetchDataByCity } from '../../services/idOfCity';
import { useAuth } from '../useAuth';

  const useGroupsByCity = (cityId, sortBy = 'name', page, pageSize = 4) => {
  const [groups, setGroups] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const { currentUser } = useAuth();
  useEffect(() => {

    const numericCityId = parseInt(cityId, 10);
    if (!numericCityId || isNaN(numericCityId)) {
      setGroups([]);
      setLoading(false);
      setHasMore(false);
      setError('Invalid city ID');
      return;
    }

    const fetchGroups = async () => {
      abortControllerRef.current = new AbortController();
      try {
        setLoading(true);
        setError(null);
        const token = currentUser?.token || localStorage.getItem('adminAccessToken');
        if (!token) {
          throw new Error('Authentication token missing');
        }
        const { groups: newGroups, hasMore: newHasMore } = await fetchDataByCity(
          'AdminGroups',
          'groups',
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
          setGroups(prevGroups => page === 1 ? newGroups : [...prevGroups, ...newGroups]);
          setHasMore(newHasMore);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Fetch error:", error);
          setGroups([]);
          setHasMore(false);
          setError(error.message || 'Failed to fetch groups');

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
  }, [cityId, sortBy, page, pageSize, currentUser]);
  return { 
    cityGroups: groups, 
    cityGroupsLoading: loading, 
    cityGroupsError: error, 
    cityGroupsHasMore: hasMore
  };
};

export default useGroupsByCity;