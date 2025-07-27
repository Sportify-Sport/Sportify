// src/hooks/createEventHooks/useEventCreate.jsx
import { useState, useCallback } from 'react';
import getApiBaseUrl from '../../config/apiConfig';

const useEventCreate = (formData, validateForm, onSuccess, setErrors, setShowErrorDialog) => {
  const [showDialog, setShowDialog] = useState(false);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const errors = validateForm();
      console.log('Validation errors:', errors); // Debug log
      if (Object.keys(errors).length > 0) {
        setErrors(errors);
        setShowErrorDialog(true);
        return;
      }
      setShowDialog(true); // Only show confirmation if no errors
    },
    [validateForm, setErrors, setShowErrorDialog]
  );

  const handleConfirm = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const payload = {
        eventName: formData.eventName,
        description: formData.description,
        sportId: parseInt(formData.sportId, 10),
        cityId: parseInt(formData.cityId, 10),
        locationName: formData.locationName,
        startDatetime: formData.startDatetime,
        endDatetime: formData.endDatetime,
        requiresTeams: formData.requiresTeams === 'true',
        isPublic: formData.isPublic === 'true',
        maxTeams: formData.requiresTeams === 'true' ? parseInt(formData.maxTeams, 10) : 0,
        maxParticipants: formData.requiresTeams === 'false' ? parseInt(formData.maxParticipants, 10) : 0,
        minAge: parseInt(formData.minAge, 10),
        gender: formData.gender,
        adminId: formData.adminId,
      };

      console.log('Submitting payload:', payload); // Debug log

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
      console.error('API error:', error); // Debug log
      setShowDialog(false);
      setShowErrorDialog(true);
      setErrors({ general: error.message || 'Failed to create event' });
    }
  }, [formData, onSuccess, setErrors, setShowErrorDialog]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
  }, []);

  return { showDialog, handleSubmit, handleConfirm, handleCancel };
};

export default useEventCreate;