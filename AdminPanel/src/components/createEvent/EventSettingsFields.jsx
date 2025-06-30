import React from 'react';
import FormField from '../actionComponents/FormField';

const GENDER_TYPES = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Mixed', label: 'Mixed' },
];

const BOOLEAN_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const EventSettingsFields = ({ formData, errors, handleChange }) => {
  return (
    <div className="form-section">
      <h3>Event Settings</h3>
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
      <FormField
        type="select"
        id="requiresTeams"
        name="requiresTeams"
        label="Requires Teams"
        value={formData.requiresTeams}
        onChange={handleChange}
        error={errors.requiresTeams}
        options={BOOLEAN_OPTIONS}
      />
      <FormField
        type="select"
        id="isPublic"
        name="isPublic"
        label="Public Event"
        value={formData.isPublic}
        onChange={handleChange}
        error={errors.isPublic}
        options={BOOLEAN_OPTIONS}
      />
      <FormField
        type="number"
        id="maxTeams"
        name="maxTeams"
        label="Maximum Teams"
        value={formData.maxTeams}
        onChange={handleChange}
        error={errors.maxTeams}
      />
      <FormField
        type="number"
        id="maxParticipants"
        name="maxParticipants"
        label="Maximum Participants"
        value={formData.maxParticipants}
        onChange={handleChange}
        error={errors.maxParticipants}
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
    </div>
  );
};

export default EventSettingsFields;