import { useCallback } from 'react';
import getApiBaseUrl from '../../config/apiConfig';

const useEventChangeAdmin = (
  cityId,
  eventId,
  selectedAdmin,
  setEvent,
  setAdminError,
  setAdminResults,
  setAdminSearchTerm,
  setSelectedAdmin,
  setShowAdminSearch,
  setShowChangeAdminModal
) => {
  const handleChangeAdmin = useCallback(async () => {
    if (!selectedAdmin) {
      setAdminError({ message: 'Please select an admin', isSuccess: false });
      return;
    }

    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await fetch(
        `${getApiBaseUrl()}/api/AdminEvents/${cityId}/change-admin/${eventId}`,
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

      setEvent((prev) => ({
        ...prev,
        eventAdminId: selectedAdmin.userId,
        eventAdminName: selectedAdmin.fullName,
        eventAdminImage: selectedAdmin.profileImage,
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
    } finally {
      setShowChangeAdminModal(false);
    }
  }, [
    cityId,
    eventId,
    selectedAdmin,
    setEvent,
    setAdminError,
    setAdminResults,
    setAdminSearchTerm,
    setSelectedAdmin,
    setShowAdminSearch,
    setShowChangeAdminModal,
  ]);

  return { handleChangeAdmin };
};

export default useEventChangeAdmin;