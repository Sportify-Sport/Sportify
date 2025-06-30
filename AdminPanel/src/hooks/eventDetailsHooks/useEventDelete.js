import { useCallback } from 'react';
import getApiBaseUrl from '../../config/apiConfig';

const useEventDelete = (cityId, eventId, setEvent, handleBack) => {
  const handleDeleteEvent = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await fetch(`${getApiBaseUrl()}/api/AdminEvents/${cityId}/event/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      handleBack();
    } catch (err) {
      console.error('Error deleting event:', err);
      setEvent((prev) => ({ ...prev, error: 'Failed to delete event' }));
    }
  }, [cityId, eventId, setEvent, handleBack]);

  return { handleDeleteEvent };
};

export default useEventDelete;