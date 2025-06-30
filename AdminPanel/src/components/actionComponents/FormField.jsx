import React from 'react';

const FormField = ({ type = 'text', id, name, label, value, onChange, onClick, error, options, placeholder, isTextarea = false,
  inputRef, min, step,
 }) => {
  const Component = isTextarea ? 'textarea' : type === 'select' ? 'select' : 'input';

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      {Component === 'select' ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={error ? 'error' : ''}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Component
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onClick={onClick}
          placeholder={placeholder}
          className={error ? 'error' : ''}
          ref={inputRef}
          min={min}
          step={step}
        />
      )}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export default FormField;