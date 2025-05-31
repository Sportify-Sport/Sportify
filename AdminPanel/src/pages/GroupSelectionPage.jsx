import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AUTH_ROUTES } from '../constants/authConstants';
import useCityId from '../hooks/useCityId';
import useGroupSearch from '../hooks/useGroupSearch'
import useGroupsByCity from '../hooks/useGroupsByCity';
import GroupCard from '../components/group/GroupCard';
import SearchBar from '../components/group/SearchBar';
import FilterDropdown from '../components/group/FilterDropDown';
import LoadingSpinner from '../components/group/LoadingSpinner';
import ShowMoreButton from '../components/group/ShowMoreButton';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/group.css';

const GroupSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cityName = location.state?.cityName;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('name');
  const [page, setPage] = useState(1);
  const abortControllerRef = useRef(null);

  const { cityId, cityIdError, cityIdLoading } = useCityId(cityName);
  const { searchedGroups, searchLoading, searchError, searchHasMore } = useGroupSearch(cityId, searchTerm,page);
  const { cityGroups, cityGroupsLoading, cityGroupsError, cityGroupsHasMore } = useGroupsByCity(cityId, filterBy, page);

  const groups = searchTerm.trim().length >= 2 ? searchedGroups : cityGroups;
  const hasMore = searchTerm.trim().length >= 2 ? searchHasMore : cityGroupsHasMore;
  const loading = cityIdLoading || searchLoading || cityGroupsLoading;
  const error = cityIdError || searchError || cityGroupsError;

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPage(1);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
  };

  const handleFilterChange = (e) => {
    setFilterBy(e.target.value);
    setPage(1);
  };
  const handleShowMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  const handleBackToDashboard = () => {
    navigate(AUTH_ROUTES.DASHBOARD);
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (loading && groups.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={handleBackToDashboard}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="group-selection-container">
      <header className="group-header">
        <button onClick={handleBackToDashboard} className="back-button">
          ← Back to Dashboard
        </button>
        <h2>Groups in {cityName}</h2>
        <ThemeToggle />
      </header>

      <div className="search-filter-container">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSearchChange={handleSearchChange}
        />
        <FilterDropdown
          filterBy={filterBy}
          handleFilterChange={handleFilterChange}
          disabled={!!searchTerm}
        />
      </div>

      <div className="groups-grid">
        {groups.map(group => (
          <GroupCard key={group.groupId} group={group} />
        ))}
        {loading && <LoadingSpinner />}
      </div>

      {groups.length > 0 && (
        <div className="show-more-container">
          <ShowMoreButton
            onClick={handleShowMore}
            disabled={!hasMore || loading}
          />
        </div>
      )}
      {groups.length === 0 && !loading && (
        <div className="no-results">No groups found</div>
      )}
    </div>
  );
};

export default GroupSelectionPage;