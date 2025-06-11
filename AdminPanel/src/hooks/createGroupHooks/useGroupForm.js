import { useState } from 'react';

export const useGroupForm = (initialState) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [showDialog, setShowDialog] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.groupName.trim()) newErrors.groupName = 'Group Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.sportId) newErrors.sportId = 'Sport type is required';
    if (!formData.cityId) newErrors.cityId = 'City is required';
    if (!formData.maxMemNum || formData.maxMemNum <= 0) newErrors.maxMemNum = 'Valid maximum members required';
    if (!formData.minAge || formData.minAge <= 0) newErrors.minAge = 'Valid min age required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.adminId) newErrors.adminId = 'Admin is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    formData,
    errors,
    showDialog,
    setFormData,
    setErrors,
    setShowDialog,
    handleInputChange,
    validateForm
  };
};