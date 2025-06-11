import { useState, useEffect, useRef } from 'react';
import { fetchGroupsByCity } from '../../services/idOfCity';
import { SPORT_TYPES } from '../../constants/sportTypes';
import { useAuth } from '../useAuth';

  const useGroupsByCity = (cityId, filterBy, page, pageSize = 4) => {
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
        const { groups: newGroups, hasMore: newHasMore } = await fetchGroupsByCity(
          numericCityId,
          filterBy,
          page,
          pageSize,
          token,
          abortControllerRef.current.signal
        );
          if (abortControllerRef.current.signal.aborted) {
          return;
        }

         if (!newGroups) {
          throw new Error('No groups data received');
        }
        const transformedData = newGroups.map(group => ({
          groupId: group.groupId || '',
          groupName: group.groupName || '',
          groupImage: group.groupImage || 'default_group.png',
          sportId: group.sportId || '',
          sportName: group.sportId ? SPORT_TYPES[group.sportId] : 'N/A',
          totalMembers: group.totalMembers || 0,
          gender: group.gender || 'N/A',
          foundedAt: group.foundedAt || group.createdAt || new Date().toISOString(),
          cityId: group.cityId || numericCityId
        }));
          setGroups(prevGroups => page === 1 ? transformedData : [...prevGroups, ...transformedData]);
          setHasMore(newHasMore);
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
  }, [cityId, filterBy, page, pageSize, currentUser]);
 const resetGroups = () => {
    setGroups([]);
  };
  return { 
    cityGroups: groups, 
    cityGroupsLoading: loading, 
    cityGroupsError: error, 
    cityGroupsHasMore: hasMore,
    resetGroups
  };
};

export default useGroupsByCity;