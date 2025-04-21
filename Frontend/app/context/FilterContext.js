// import React, { createContext, useState, useContext } from "react";

// const FilterContext = createContext();

// export const FilterProvider = ({ children }) => {
//   const [filters, setFilters] = useState({
//     sport: null,
//     city: null,
//     age: null,
//     gender: null,
//     date: null,
//   });
//   const [filteredNames, setFilteredNames] = useState([]);

//   return (
//     <FilterContext.Provider value={{ filters, setFilters, filteredNames, setFilteredNames }}>
//       {children}
//     </FilterContext.Provider>
//   );
// };

// export const useFilters = () => useContext(FilterContext);

// // Add this default export if you actually want to use this file as a route
// export default FilterProvider;

import React, { createContext, useState, useContext } from "react";

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    sport: null,
    city: null,
    age: null,
    gender: null,
    date: null,
    startDate: null,
    endDate: null,
    resetSearch: false,
  });
  const [filteredNames, setFilteredNames] = useState([]);
  const clearSearch = () => {
        // This will be set by SearchScreen
      };
  return (
    <FilterContext.Provider value={{ filters, setFilters, filteredNames, setFilteredNames, clearSearch }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => useContext(FilterContext);

// Add this default export if you actually want to use this file as a route
export default FilterProvider;