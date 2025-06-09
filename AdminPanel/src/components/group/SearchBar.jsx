import React, { useRef, useEffect }  from 'react';

const SearchBar = ({ searchTerm, setSearchTerm }) => {
   const inputRef = useRef(null);
   useEffect(() => {
    inputRef.current.focus();
    }, []);
  return (
    <div className="search-box">
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search groups by name..."
        className="search-input"
      />
    </div>
  );
};

export default SearchBar;