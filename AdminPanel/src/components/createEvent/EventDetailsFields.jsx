import React from 'react';
import { SPORT_TYPES } from '../../constants/sportTypes';
import FormField from '../actionComponents/FormField';

const EventDetailsFields = ({ formData, errors, handleChange, selectedCity }) => {
  const sportOptions = Object.entries(SPORT_TYPES).map(([id, name]) => ({
    value: id,
    label: name,
  }));

  return (
    <div className="form-section">
      <h3>Event Details</h3>
      <FormField
        id="eventName"
        name="eventName"
        label="Event Name"
        value={formData.eventName}
        onChange={handleChange}
        error={errors.eventName}
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
        id="locationName"
        name="locationName"
        label="Location"
        value={formData.locationName}
        onChange={handleChange}
        error={errors.locationName}
      />
    </div>
  );
};

export default EventDetailsFields;