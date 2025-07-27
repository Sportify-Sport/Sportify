import React from 'react';
import FormField from '../actionComponents/FormField';

const GENDER_TYPES = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Mixed', label: 'Mixed' },
];

const EVENT_TYPE_OPTIONS = [
  { value: 'true', label: 'Teams Event (players join as teams)' },
  { value: 'false', label: 'Individual Event (players join individually)' },
];

const PUBLIC_EVENT_OPTIONS = [
  { value: 'true', label: 'Public Event (visible to everyone)' },
  { value: 'false', label: 'Private Event (invite only)' },
];

const EventSettingsFields = ({ formData, errors, handleChange }) => {
  // For individual events, only allow public events
  const publicEventOptions = formData.requiresTeams === 'false' 
    ? [{ value: 'true', label: 'Public Event (visible to everyone)' }]
    : PUBLIC_EVENT_OPTIONS;

  // Auto-set public event to true for individual events
  React.useEffect(() => {
    if (formData.requiresTeams === 'false' && formData.isPublic !== 'true') {
      handleChange({ target: { name: 'isPublic', value: 'true' } });
    }
  }, [formData.requiresTeams]); // Remove dependencies that might cause loops

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
        label="Event Type"
        value={formData.requiresTeams}
        onChange={handleChange}
        error={errors.requiresTeams}
        options={EVENT_TYPE_OPTIONS}
      />
      <FormField
        type="select"
        id="isPublic"
        name="isPublic"
        label="Event Visibility"
        value={formData.isPublic}
        onChange={handleChange}
        error={errors.isPublic}
        options={publicEventOptions}
        disabled={formData.requiresTeams === 'false'} // Disable for individual events
      />
      {/* Show Max Teams only for team events */}
      {formData.requiresTeams === 'true' && (
        <FormField
          type="number"
          id="maxTeams"
          name="maxTeams"
          label="Maximum Teams"
          value={formData.maxTeams}
          onChange={handleChange}
          error={errors.maxTeams}
          placeholder="Enter maximum number of teams"
          min="1"
        />
      )}
      {/* Show Max Participants only for individual events */}
      {formData.requiresTeams === 'false' && (
        <FormField
          type="number"
          id="maxParticipants"
          name="maxParticipants"
          label="Maximum Participants"
          value={formData.maxParticipants}
          onChange={handleChange}
          error={errors.maxParticipants}
          placeholder="Enter maximum number of participants"
          min="1"
        />
      )}
      <FormField
        type="number"
        id="minAge"
        name="minAge"
        label="Minimum Age"
        value={formData.minAge}
        onChange={handleChange}
        error={errors.minAge}
        min="1"
      />
    </div>
  );
};

export default EventSettingsFields;