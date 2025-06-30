import React, { useEffect } from 'react';
import { SPORT_TYPES } from '../../constants/sportTypes';
import FormField from '../actionComponents/FormField';
import AdminSearch from '../actionComponents/AdminSearch';
import ConfirmationDialog from '../actionComponents/ConfirmationDialog';
import useForm from '../../hooks/useForm';
import useGroupCreate from '../../hooks/createGroupHooks/useGroupCreate';

const GENDER_TYPES = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Mixed', label: 'Mixed' },
];

const validate = (formData) => {
  const newErrors = {};
  if (!formData.groupName.trim()) newErrors.groupName = 'Group Name is required';
  if (!formData.description.trim()) newErrors.description = 'Description is required';
  if (!formData.sportId) newErrors.sportId = 'Sport type is required';
  if (!formData.cityId) newErrors.cityId = 'City is required';
  if (!formData.maxMemNum || formData.maxMemNum <= 0) newErrors.maxMemNum = 'Valid maximum members required';
  if (!formData.minAge || formData.minAge <= 0) newErrors.minAge = 'Valid minimum age required';
  if (!formData.gender) newErrors.gender = 'Gender is required';
  if (!formData.adminId) newErrors.adminId = 'Admin is required';
  return newErrors;
};

const CreateGroupForm = ({
  onSuccess,
  adminUsers,
  adminSearchLoading,
  adminSearchError,
  onAdminSearch,
  selectedCity,
}) => {
  const initialFormData = {
    groupName: '',
    description: '',
    sportId: '',
    cityId: selectedCity?.cityId || '',
    maxMemNum: '',
    minAge: '',
    gender: '',
    adminId: null,
    adminSearchTerm: '',
  };

  const { formData, errors, handleChange, validateForm, setFormData, setErrors } = useForm(
    initialFormData,
    validate
  );

  useEffect(() => {
    if (selectedCity?.cityId) {
      setFormData((prev) => ({ ...prev, cityId: selectedCity.cityId }));
    }
  }, [selectedCity, setFormData]);

  const { showDialog, handleSubmit, handleConfirm, handleCancel } = useGroupCreate(
    formData,
    validateForm,
    onSuccess,
    setErrors
  );

  const handleAdminSearch = (value) => {
    handleChange({ target: { name: 'adminSearchTerm', value } });
    onAdminSearch(value);
  };

  const handleAdminSelect = (userId) => {
  setFormData((prev) => ({
    ...prev,
    adminId: prev.adminId === userId ? null : userId 
  }));
  setErrors((prevErrors) => ({ ...prevErrors, adminId: '' }));
};

  const sportOptions = Object.entries(SPORT_TYPES).map(([id, name]) => ({
    value: id,
    label: name,
  }));

  return (
    <div className="create-form">
      <h2>Create New Group Form</h2>
      {errors.general && <span className="error-text">{errors.general}</span>}
      <form onSubmit={handleSubmit}>
        <FormField
          id="groupName"
          name="groupName"
          label="Group Name"
          value={formData.groupName}
          onChange={handleChange}
          error={errors.groupName}
        />
        <FormField
          id="description"
          name="description"
          label="Description"
          value={formData.description}
          onChange={handleChange}
          error={errors.description}
          isTextarea
        />
        <FormField
          type="select"
          id="sportId"
          name="sportId"
          label="Sport"
          value={formData.sportId}
          onChange={handleChange}
          error={errors.sportId}
          options={sportOptions}
        />
        <div className="form-group">
          <label>City</label>
          <div className="read-only-text">{selectedCity?.cityName || 'No city selected'}</div>
          {errors.cityId && <span className="error-text">{errors.cityId}</span>}
        </div>
        <FormField
          type="number"
          id="maxMemNum"
          name="maxMemNum"
          label="Maximum Members"
          value={formData.maxMemNum}
          onChange={handleChange}
          error={errors.maxMemNum}
        />
        <FormField
          type="number"
          id="minAge"
          name="minAge"
          label="Minimum Age"
          value={formData.minAge}
          onChange={handleChange}
          error={errors.minAge}
        />
        <FormField
          type="select"
          id="gender"
          name="gender"
          label="Gender"
          value={formData.gender}
          onChange={handleChange}
          error={errors.gender}
          options={GENDER_TYPES}
        />
        <AdminSearch
          adminSearchTerm={formData.adminSearchTerm}
          onAdminSearch={handleAdminSearch}
          adminUsers={adminUsers}
          adminSearchLoading={adminSearchLoading}
          adminSearchError={adminSearchError}
          adminId={formData.adminId}
          onAdminSelect={handleAdminSelect}
          error={errors.adminId}
        />
        <button type="submit" className="create-submit-button">Create Group</button>
      </form>
      {showDialog && (
        <ConfirmationDialog
          message="Are you sure you want to create this group?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default CreateGroupForm;