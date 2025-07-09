import { useState, useCallback } from 'react';
import getApiBaseUrl from '../../config/apiConfig';

const useGroupEditDetails = (entityId, entityType, initialData, onUpdate) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormChanged, setIsFormChanged] = useState(false);

  const initializeFormData = useCallback((data) => {
    setFormData({
      name: data?.name || '',
      description: data?.description || ''
    });
    setIsFormChanged(false);
    setImageFile(null);
    setError(null);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      const hasChanged =
        newData.name !== (initialData?.groupName || '') ||
        newData.description !== (initialData?.description || '') ||
        imageFile !== null;
      setIsFormChanged(hasChanged);
      return newData;
    });
    setError(null);
  }, [initialData, imageFile]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError({ message: 'Invalid file type. Please upload PNG, JPG, or WebP.' });
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

      let updatedEntity = { ...initialData };
      if (formData.name !== initialData?.groupName || formData.description !== initialData?.description) {
        const detailsResponse = await fetch(`${getApiBaseUrl()}/api/Groups/${entityId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            groupName: formData.name, 
            description: formData.description 
          }),
        });

        if (!detailsResponse.ok) {
          const errorData = await detailsResponse.json();
          throw new Error(errorData.message || 'Failed to update group details');
        }
        updatedEntity = { 
          ...updatedEntity, 
          groupName: formData.name, 
          description: formData.description 
        };
      }

      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append('groupImage', imageFile);
        const imageResponse = await fetch(`${getApiBaseUrl()}/api/Groups/${entityId}/image`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataImage,
        });

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json();
          throw new Error(errorData.message || 'Failed to update group image');
        }

        const imageUrl = `${getApiBaseUrl()}/images/${imageFile.name}?t=${Date.now()}`;
        updatedEntity = { ...updatedEntity, groupImage: imageUrl };
      }

      onUpdate(updatedEntity);
    } catch (err) {
      setError({ message: err.message });
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
    initializeFormData,
  };
};

export default useGroupEditDetails;