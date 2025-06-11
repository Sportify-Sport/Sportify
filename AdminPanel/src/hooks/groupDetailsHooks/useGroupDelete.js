import { useCallback } from 'react';
import getApiBaseUrl from '../../config/apiConfig';

const useGroupDelete = (cityId, groupId, setGroup, handleBack) => {
  const handleDeleteGroup = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await fetch(`${getApiBaseUrl()}/api/AdminGroups/${cityId}/group/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      handleBack();
    } catch (err) {
      console.error('Error deleting group:', err);
      setGroup((prev) => ({ ...prev, error: 'Failed to delete group' }));
    }
  }, [cityId, groupId, setGroup, handleBack]);

  return { handleDeleteGroup };
};

export default useGroupDelete;