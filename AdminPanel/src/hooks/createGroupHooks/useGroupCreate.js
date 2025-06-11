import { useState } from 'react';
import getApiBaseUrl from '../../config/apiConfig';

const useGroupCreate = (formData, validateForm, onSuccess, setErrors) => {
  const [showDialog, setShowDialog] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validateForm()) {
      setShowDialog(true);
    }
  };

  const handleConfirm = async () => {
    setShowDialog(false);
    try {
      const token = localStorage.getItem('adminAccessToken');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      const response = await fetch(`${getApiBaseUrl()}/api/AdminGroups/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName: formData.groupName,
          description: formData.description,
          sportId: parseInt(formData.sportId),
          cityId: parseInt(formData.cityId),
          maxMemNum: parseInt(formData.maxMemNum),
          minAge: parseInt(formData.minAge),
          gender: formData.gender,
          adminId: formData.adminId,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create group');
      }

      onSuccess(data);
    } catch (error) {
      setErrors((prev) => ({ ...prev, general: error.message }));
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  return { showDialog, handleSubmit, handleConfirm, handleCancel };
};

export default useGroupCreate;