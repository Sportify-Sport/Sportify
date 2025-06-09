import { useCallback } from 'react';
import getApiBaseUrl from '../config/apiConfig';

const useAdminChange = (cityId, groupId, selectedAdmin, setGroup, setAdminError, setAdminResults, setAdminSearchTerm, setSelectedAdmin, setShowAdminSearch) => {
  const handleChangeAdmin = useCallback(async () => {
    if (!selectedAdmin) {
      setAdminError({ message: 'Please select an admin', isSuccess: false });
      return;
    }

    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await fetch(
        `${getApiBaseUrl()}/api/AdminGroups/${cityId}/change-admin/${groupId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: selectedAdmin.userId }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to change admin');
      }

      setGroup((prev) => ({
        ...prev,
        groupAdminId: selectedAdmin.userId,
        groupAdminName: selectedAdmin.fullName,
        groupAdminImage: selectedAdmin.profileImage,
      }));

      setAdminError({ message: data.message || 'Admin changed successfully', isSuccess: true });

      setTimeout(() => {
        setAdminResults([]);
        setAdminSearchTerm('');
        setSelectedAdmin(null);
        setShowAdminSearch(false);
      }, 2000);
    } catch (err) {
      setAdminError({ message: err.message || 'Failed to change admin', isSuccess: false });
    }
  }, [cityId, groupId, selectedAdmin, setGroup, setAdminError, setAdminResults, setAdminSearchTerm, setSelectedAdmin, setShowAdminSearch]);

  return { handleChangeAdmin };
};

export default useAdminChange;