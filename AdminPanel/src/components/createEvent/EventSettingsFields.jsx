// import React from 'react';
// import FormField from '../actionComponents/FormField';

// const GENDER_TYPES = [
//   { value: 'Male', label: 'Male' },
//   { value: 'Female', label: 'Female' },
//   { value: 'Mixed', label: 'Mixed' },
// ];

// const BOOLEAN_OPTIONS = [
//   { value: 'true', label: 'Yes' },
//   { value: 'false', label: 'No' },
// ];

// const EventSettingsFields = ({ formData, errors, handleChange }) => {
//   return (
//     <div className="form-section">
//       <h3>Event Settings</h3>
//       <FormField
//         type="select"
//         id="gender"
//         name="gender"
//         label="Gender"
//         value={formData.gender}
//         onChange={handleChange}
//         error={errors.gender}
//         options={GENDER_TYPES}
//       />
//       <FormField
//         type="select"
//         id="requiresTeams"
//         name="requiresTeams"
//         label="Include Teams"
//         value={formData.requiresTeams}
//         onChange={handleChange}
//         error={errors.requiresTeams}
//         options={BOOLEAN_OPTIONS}
//       />
//       <FormField
//         type="select"
//         id="isPublic"
//         name="isPublic"
//         label="Public Event"
//         value={formData.isPublic}
//         onChange={handleChange}
//         error={errors.isPublic}
//         options={BOOLEAN_OPTIONS}
//       />
//       {formData.sportId === '3' && (
//         <FormField
//           type="number"
//           id="maxParticipants"
//           name="maxParticipants"
//           label="Maximum Participants"
//           value={formData.maxParticipants}
//           onChange={handleChange}
//           error={errors.maxParticipants}
//         />
//       )}
//       {(formData.sportId === '1' || formData.sportId === '2') && (
//         <FormField
//           type="number"
//           id="maxTeams"
//           name="maxTeams"
//           label="Maximum Teams"
//           value={formData.maxTeams}
//           onChange={handleChange}
//           error={errors.maxTeams}
//         />
//       )}
//       <FormField
//         type="number"
//         id="minAge"
//         name="minAge"
//         label="Minimum Age"
//         value={formData.minAge}
//         onChange={handleChange}
//         error={errors.minAge}
//       />
//     </div>
//   );
// };

// export default EventSettingsFields;





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
  }, [formData.requiresTeams, formData.isPublic, handleChange]);

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
      />
    </div>
  );
};

export default EventSettingsFields;
