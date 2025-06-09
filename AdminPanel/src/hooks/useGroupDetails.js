import { useState, useEffect } from 'react';
import getApiBaseUrl from '../config/apiConfig';
import { SPORT_TYPES } from '../constants/sportTypes';

const useGroupDetails = (groupId, cityId, cityName) => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const token = localStorage.getItem('adminAccessToken');
        const response = await fetch(`${getApiBaseUrl()}/api/AdminGroups/${cityId}/group/${groupId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch group details');
        }

        const data = await response.json();
        setGroup({
          ...data,
          sportName: SPORT_TYPES[data.sportId] || 'Unknown',
          cityName,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching group details:', err);
        setError('Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId, cityId, cityName]);

  return { group, groupLoading: loading, groupError: error, setGroup };
};

export default useGroupDetails;