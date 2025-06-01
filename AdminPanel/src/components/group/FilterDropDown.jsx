import React from 'react';
const FilterDropdown = ({ filterBy, handleFilterChange, disabled }) => {
  const FILTER_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'sport', label: 'Sport' },
  { value: 'foundedAt', label: 'Founded Date' },
  { value: 'members', label: 'Members' }
];
  return (
    <div className="filter-dropdown">
      <label htmlFor="filter-select">Filter By:</label>
      <select
        id="filter-select"
        value={filterBy}
        onChange={handleFilterChange}
        className="filter-select"
        disabled={disabled}
      >
        {FILTER_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterDropdown;