import React from 'react';
import { FILTER_OPTIONS } from '../../constants/filterOptions';

const FilterDropdown = ({ filterBy, handleFilterChange, disabled }) => {
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