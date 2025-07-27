import React from 'react';

const FilterDropdown = ({ filterBy, handleFilterChange, disabled }) => {
  const options = [
    { value: 'name', label: 'Name' },
    { value: 'sport', label: 'Sport' },
    { value: 'requiresteamstrue', label: 'Team Events' },
    { value: 'requiresteamsfalse', label: 'None-Team Events' },
  ];

  return (
    <div className='filter-dropdown'>
      <label htmlFor="filter-select">Filter By:</label>
      <select
        value={filterBy}
        onChange={handleFilterChange}
        disabled={disabled}
        className="sort-select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterDropdown;