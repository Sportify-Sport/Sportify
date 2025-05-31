import React from 'react';

const SearchBar = ({ searchTerm, setSearchTerm, handleSearchChange }) => {
  return (
    <div className="search-box">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          handleSearchChange({ target: { value: e.target.value.toLowerCase() } });
        }}
        placeholder="Search groups by name..."
        className="search-input"
      />
    </div>
  );
};

export default SearchBar;