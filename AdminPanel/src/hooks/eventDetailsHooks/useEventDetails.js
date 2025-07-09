import { useState, useEffect, useCallback } from 'react';
import getApiBaseUrl from '../../config/apiConfig';
import { SPORT_TYPES } from '../../constants/sportTypes';

const useEventDetails = (eventId, cityId, cityName) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEventDetails = useCallback(async () => {
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
  }, [eventId, cityId, cityName]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  // Updated to add cache-busting parameter for image
  const updateEventImage = useCallback((updatedEntity) => {
    setEvent((prevEvent) => {
      const newImageUrl = updatedEntity.eventImage;
      // Add cache-busting query parameter to prevent 404 caching
      const validImageUrl = newImageUrl && !newImageUrl.includes('undefined')
        ? `${newImageUrl}?t=${Date.now()}`
        : '/images/placeholder.jpg';
      return {
        ...prevEvent,
        eventImage: validImageUrl,
        eventName: updatedEntity.eventName || prevEvent.eventName,
        description: updatedEntity.description || prevEvent.description,
        locationName: updatedEntity.locationName || prevEvent.locationName,
      };
    });
  }, []);

  // Refresh event details after image upload
  const refreshEventDetails = useCallback(async () => {
    setLoading(true);
    await fetchEventDetails();
  }, [fetchEventDetails]);

  return { event, eventLoading: loading, eventError: error, setEvent, updateEventImage, refreshEventDetails };
};

export default useEventDetails;