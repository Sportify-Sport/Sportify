import React from 'react';
import FormField from '../actionComponents/FormField';
import useDateTimeFields from '../../hooks/createEventHooks/useDateTimeFields';

const DateTimeFields = ({ formData, errors, handleChange }) => {
  const {
    startDateRef,
    startTimeRef,
    endDateRef,
    endTimeRef,
    formatDateForInput,
    formatTimeForInput,
    handleDateChange,
    handleTimeChange,
    preventTyping,
    handleDateClick,
    handleTimeClick,
  } = useDateTimeFields(formData, handleChange);

  const currentDate = new Date();
  currentDate.setMinutes(0, 0, 0);
  const minDate = formatDateForInput(currentDate);

  return (
    <div className="form-section">
      <h3>Date and Time</h3>
      <div className="datetime-group">
        <FormField
          type="date"
          id="startDate"
          name="startDate"
          label="Start Date"
          value={formData.startDatetime ? formatDateForInput(formData.startDatetime) : ''}
          onChange={(e) => handleDateChange(e, 'startDatetime')}
          onClick={() => handleDateClick(startDateRef)}
          onKeyDown={preventTyping}
          error={errors.startDatetime}
          inputRef={startDateRef}
          min={minDate}
        />
        <FormField
          type="time"
          id="startTime"
          name="startTime"
          label="Start Time (24-hour)"
          value={formData.startDatetime ? formatTimeForInput(formData.startDatetime) : ''}
          onChange={(e) => handleTimeChange(e, 'startDatetime')}
          onClick={() => handleTimeClick(startTimeRef)}
          onKeyDown={preventTyping}
          error={errors.startDatetime}
          inputRef={startTimeRef}
          step="3600"
        />
      </div>
      <div className="datetime-group">
        <FormField
          type="date"
          id="endDate"
          name="endDate"
          label="End Date"
          value={formData.endDatetime ? formatDateForInput(formData.endDatetime) : ''}
          onChange={(e) => handleDateChange(e, 'endDatetime')}
          onClick={() => handleDateClick(endDateRef)}
          onKeyDown={preventTyping}
          error={errors.endDatetime}
          inputRef={endDateRef}
          min={formData.startDatetime ? formatDateForInput(formData.startDatetime) : minDate}
        />
        <FormField
          type="time"
          id="endTime"
          name="endTime"
          label="End Time (24-hour)"
          value={formData.endDatetime ? formatTimeForInput(formData.endDatetime) : ''}
          onChange={(e) => handleTimeChange(e, 'endDatetime')}
          onClick={() => handleTimeClick(endTimeRef)}
          onKeyDown={preventTyping}
          error={errors.endDatetime}
          inputRef={endTimeRef}
          step="3600"
        />
      </div>
    </div>
  );
};

export default DateTimeFields;