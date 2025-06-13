import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { AUTH_ROUTES } from '../../constants/authConstants';
import useCityId from '../../hooks/useCityId';
import { useAuth } from '../../hooks/useAuth';
import useGroupSearch from '../../hooks/groupHooks/useGroupSearch';
import useGroupsByCity from '../../hooks/groupHooks/useGroupsByCity';
import SearchBar from '../../components/group/SearchBar';
import FilterDropdown from '../../components/group/FilterDropDown';
import GroupsGrid from '../../components/group/GroupsGrid';
import LoadingSpinner from '../../components/LoadingSpinner';
import ThemeToggle from '../../components/ThemeToggle';
import '../../styles/groupStyles/group.css';

const GroupSelectionPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { cityId } = useParams();
  const cityName = location.state?.cityName;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('name');
  const [page, setPage] = useState(1);
  const abortControllerRef = useRef(null);

  const { cityId: fetchedCityId, cityIdError, cityIdLoading } = useCityId(cityName);
  const effectiveCityId = cityId || fetchedCityId;
  const { searchedGroups, searchLoading, searchError, searchHasMore } = useGroupSearch(effectiveCityId, searchTerm, filterBy, page, 10);
  const { cityGroups, cityGroupsLoading, cityGroupsError, cityGroupsHasMore } = useGroupsByCity(effectiveCityId, filterBy, page, 4);

  const groups = searchTerm.trim().length >= 2 ? searchedGroups : cityGroups;
  const hasMore = searchTerm.trim().length >= 2 ? searchHasMore : cityGroupsHasMore;
  const loading = cityIdLoading || searchLoading || cityGroupsLoading;
  const error = cityIdError || searchError || cityGroupsError;
  const [searchInputValue, setSearchInputValue] = useState('');

  const handleFilterChange = (e) => {
    setFilterBy(e.target.value);
    setPage(1);
  };

  const handleSearchInputChange = (value) => {
    setSearchInputValue(value);
    setPage(1); 
  };
  const handleShowMore = () => {
    setPage((prevPage) => prevPage + 1);
  };
  const handleBackToDashboard = () => {
    navigate(AUTH_ROUTES.DASHBOARD);
  };
  const handleChangeCity = () => {
    navigate(AUTH_ROUTES.CITY_SELECTION);
  };
  const handleCreateButton = () => {
    navigate(AUTH_ROUTES.CREATE_GROUP);
  };
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

    useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInputValue);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInputValue]);

  if (loading && groups.length === 0) {
    return <LoadingSpinner text= "Loading groups..." />;
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
        <h2>Groups in {cityName || 'Unknown'}</h2>
        <div  className="dashboard-actions">
        <ThemeToggle />
         <button onClick={handleChangeCity} className="change-city-btn">
          Change City
        </button>
        <button onClick={logout} className="logout-btn">
          Log Out
        </button>
        </div>
      </header>

      <div className="search-filter-container">
        <button className="create-group-button" onClick={handleCreateButton}>Create</button>
        <SearchBar
          searchTerm={searchInputValue}
          setSearchTerm={handleSearchInputChange}
        />
        <FilterDropdown
          filterBy={filterBy}
          handleFilterChange={handleFilterChange}
          disabled={searchTerm.trim().length >= 2}
        />
      </div>
      <GroupsGrid
        groups={groups}
        loading={loading}
        hasMore={hasMore}
        onShowMore={handleShowMore}
        cityName={cityName}
      />
    </div>
  );
};

export default GroupSelectionPage;