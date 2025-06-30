import { useState, useEffect } from 'react';
import getApiBaseUrl from '../../config/apiConfig';
import { SPORT_TYPES } from '../../constants/sportTypes';

const useEventDetails = (eventId, cityId, cityName) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const token = localStorage.getItem('adminAccessToken');
        const response = await fetch(`${getApiBaseUrl()}/api/AdminEvents/${cityId}/event/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch event details');
        }

        const data = await response.json();
        setEvent({
          ...data,
          sportName: SPORT_TYPES[data.sportId] || 'Unknown',
          cityName,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, cityId, cityName]);

  return { event, eventLoading: loading, eventError: error, setEvent };
};

export default useEventDetails;