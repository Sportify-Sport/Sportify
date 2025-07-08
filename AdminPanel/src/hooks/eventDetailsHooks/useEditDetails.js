import { useState, useCallback } from 'react';
import getApiBaseUrl from '../../config/apiConfig';

const useEditDetails = (entityId, entityType, initialData, onUpdate) => {
  const [formData, setFormData] = useState({
    name: initialData?.eventName || initialData?.groupName || '',
    description: initialData?.description || '',
    locationName: initialData?.locationName || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormChanged, setIsFormChanged] = useState(false);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      const hasChanged =
        newData.name !== (initialData?.eventName || initialData?.groupName) ||
        newData.description !== initialData?.description ||
        newData.locationName !== initialData?.locationName ||
        imageFile !== null;
      setIsFormChanged(hasChanged);
      return newData;
    });
  }, [initialData, imageFile]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError({ message: 'Invalid file type. Please upload JPG, JPEG, PNG, or WebP.', isSuccess: false });
        setImageFile(null);
        return;
      }
      setImageFile(file);
      setIsFormChanged(true);
      setError(null);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormChanged) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminAccessToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Update event details
      const detailsPayload = {
        eventName: formData.name,
        description: formData.description,
        locationName: formData.locationName,
      };
      const detailsResponse = await fetch(`${getApiBaseUrl()}/api/Events/${entityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(detailsPayload),
      });

      const detailsResult = await detailsResponse.json();
      if (!detailsResponse.ok) {
        if (detailsResponse.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(detailsResult.message || 'Failed to update event details');
      }

      // Update event image if provided
      let updatedEntity = { ...initialData, ...detailsPayload };
      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append('eventImage', imageFile);
        const imageResponse = await fetch(`${getApiBaseUrl()}/api/Events/${entityId}/image`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*',
          },
          body: formDataImage,
        });

        const imageResult = await imageResponse.json();
        if (!imageResponse.ok) {
          if (imageResponse.status === 401) {
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error(imageResult.message || 'Failed to update event image');
        }
        // Construct image URL assuming server stores at /images/<filename>
        const imageUrl = imageResult.imageUrl || `${getApiBaseUrl()}/images/${encodeURIComponent(imageFile.name)}`;
        updatedEntity = { ...updatedEntity, eventImage: imageUrl };
      }

      onUpdate(updatedEntity);
    } catch (err) {
      setError({ message: err.message, isSuccess: false });
    } finally {
      setIsLoading(false);
    }
  }, [entityId, formData, imageFile, initialData, onUpdate, isFormChanged]);

  return {
    formData,
    imageFile,
    error,
    isLoading,
    isFormChanged,
    handleInputChange,
    handleImageChange,
    handleSubmit,
  };
};

export default useEditDetails;