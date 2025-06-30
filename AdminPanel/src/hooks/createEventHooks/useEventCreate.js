import { useState, useCallback } from 'react';
import getApiBaseUrl from '../../config/apiConfig';

const useEventCreate = (formData, validateForm, onSuccess, setErrors) => {
  const [showDialog, setShowDialog] = useState(false);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setErrors(errors);
        return;
      }
      setShowDialog(true);
    },
    [validateForm, setErrors]
  );

  const handleConfirm = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      const payload = {
        eventName: formData.eventName,
        description: formData.description,
        sportId: parseInt(formData.sportId, 10),
        cityId: parseInt(formData.cityId, 10),
        locationName: formData.locationName,
        startDatetime: formData.startDatetime,
        endDatetime: formData.endDatetime,
        maxParticipants: parseInt(formData.maxParticipants, 10),
        minAge: parseInt(formData.minAge, 10),
        gender: formData.gender,
        adminId: formData.adminId,
      };

      const response = await fetch(`${getApiBaseUrl()}/api/AdminEvents/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create event');
      }

      setShowDialog(false);
      onSuccess({ message: data.message || 'Event created successfully' });
    } catch (error) {
      setShowDialog(false);
      setErrors({ general: error.message || 'Failed to create event' });
    }
  }, [formData, onSuccess, setErrors]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
  }, []);

  return { showDialog, handleSubmit, handleConfirm, handleCancel };
};

export default useEventCreate;