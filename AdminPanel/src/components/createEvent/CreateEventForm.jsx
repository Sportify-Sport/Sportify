import React, { useEffect } from 'react';
import EventDetailsFields from './EventDetailsFields';
import DateTimeFields from './DateTimeFields';
import EventSettingsFields from './EventSettingsFields';
import AdminSearch from '../actionComponents/AdminSearch';
import ConfirmationDialog from '../actionComponents/ConfirmationDialog';
import useForm from '../../hooks/useForm';
import useEventCreate from '../../hooks/createEventHooks/useEventCreate';

const validate = (formData) => {
  const newErrors = {};
  if (!formData.eventName.trim()) newErrors.eventName = 'Event Name is required';
  if (!formData.description.trim()) newErrors.description = 'Description is required';
  if (!formData.sportId) newErrors.sportId = 'Sport type is required';
  if (!formData.cityId) newErrors.cityId = 'City is required';
  if (!formData.locationName.trim()) newErrors.locationName = 'Location is required';
  if (!formData.startDatetime) newErrors.startDatetime = 'Start date and time are required';
  if (!formData.endDatetime) newErrors.endDatetime = 'End date and time are required';
  if (formData.startDatetime && formData.endDatetime && new Date(formData.startDatetime) >= new Date(formData.endDatetime)) {
    newErrors.endDatetime = 'End date must be after start date';
  }
  if (!formData.maxParticipants || formData.maxParticipants <= 0) newErrors.maxParticipants = 'Valid maximum participants required';
  if (!formData.minAge || formData.minAge <= 0) newErrors.minAge = 'Valid minimum age required';
  if (!formData.gender) newErrors.gender = 'Gender is required';
  if (!formData.adminId) newErrors.adminId = 'Admin is required';
  if (formData.requiresTeams === '') newErrors.requiresTeams = 'Requires Teams selection is required';
  if (formData.isPublic === '') newErrors.isPublic = 'Public Event selection is required';
  if (formData.requiresTeams === 'true' && (!formData.maxTeams || formData.maxTeams <= 0)) {
    newErrors.maxTeams = 'Valid maximum teams required when teams are required';
  }
  return newErrors;
};

const CreateEventForm = ({
  onSuccess,
  adminUsers,
  adminSearchLoading,
  adminSearchError,
  onAdminSearch,
  selectedCity,
}) => {
  const initialFormData = {
    eventName: '',
    description: '',
    sportId: '',
    cityId: selectedCity?.cityId || '',
    locationName: '',
    startDatetime: '',
    endDatetime: '',
    maxParticipants: '',
    minAge: '',
    gender: '',
    adminId: null,
    adminSearchTerm: '',
    requiresTeams: '',
    isPublic: '',
    maxTeams: '',
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

  const { showDialog, handleSubmit, handleConfirm, handleCancel } = useEventCreate(
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

  return (
    <div className="create-form">
      <h2>Create New Event Form</h2>
      {errors.general && <span className="error-text">{errors.general}</span>}
      <form onSubmit={handleSubmit}>
        <EventDetailsFields
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          selectedCity={selectedCity}
        />
        <DateTimeFields
          formData={formData}
          errors={errors}
          handleChange={handleChange}
        />
        <EventSettingsFields
          formData={formData}
          errors={errors}
          handleChange={handleChange}
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
        <button type="submit" className="create-submit-button">Create Event</button>
      </form>
      {showDialog && (
        <ConfirmationDialog
          message="Are you sure you want to create this event?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default CreateEventForm;