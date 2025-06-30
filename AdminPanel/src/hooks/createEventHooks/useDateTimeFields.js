import { useRef } from 'react';

const useDateTimeFields = (formData, handleChange) => {
  const startDateRef = useRef(null);
  const startTimeRef = useRef(null);
  const endDateRef = useRef(null);
  const endTimeRef = useRef(null);

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const combineDateTime = (dateValue, timeValue) => {
    if (!dateValue || !timeValue) return '';
    const [year, month, day] = dateValue.split('-');
    const [hours, minutes] = timeValue.split(':');
    const date = new Date(year, month - 1, day, hours, minutes);
    return isNaN(date.getTime()) ? '' : date.toISOString();
  };

  const handleDateChange = (e, field) => {
    const dateValue = e.target.value;
    const timeValue = formatTimeForInput(formData[field]) || '00:00';
    const newDateTime = combineDateTime(dateValue, timeValue);
    handleChange({ target: { name: field, value: newDateTime } });
  };

  const handleTimeChange = (e, field) => {
    const timeValue = e.target.value;
    const dateValue = formatDateForInput(formData[field]) || formatDateForInput(new Date());
    const newDateTime = combineDateTime(dateValue, timeValue);
    handleChange({ target: { name: field, value: newDateTime } });
  };

  const preventTyping = (e) => {
    e.preventDefault();
  };

  const handleDateClick = (ref) => {
    if (ref.current) {
      ref.current.showPicker();
    }
  };

  const handleTimeClick = (ref) => {
    if (ref.current) {
      ref.current.showPicker();
    }
  };

  return {
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
  };
};

export default useDateTimeFields;