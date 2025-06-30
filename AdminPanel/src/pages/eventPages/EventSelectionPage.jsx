import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { AUTH_ROUTES } from '../../constants/authConstants';
import useCityId from '../../hooks/useCityId';
import { useAuth } from '../../hooks/useAuth';
import useEventSearch from '../../hooks/eventHooks/useEventSearch';
import useEventsByCity from '../../hooks/eventHooks/useEventsByCity';
import SearchBar from '../../components/actionComponents/SearchBar';
import FilterDropdown from '../../components/event/FilterDropdown';
import EventsGrid from '../../components/event/EventsGrid';
import LoadingSpinner from '../../components/LoadingSpinner';
import ThemeToggle from '../../components/ThemeToggle';
import '../../styles/globalPagesStyles/pages-styles.css';

const EventSelectionPage = () => {
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
  const { searchedEvents, searchLoading, searchError, searchHasMore } = useEventSearch(effectiveCityId, searchTerm, filterBy, page, 10);
  const { cityEvents, cityEventsLoading, cityEventsError, cityEventsHasMore } = useEventsByCity(effectiveCityId, filterBy, page, 4);

  const events = searchTerm.trim().length >= 2 ? searchedEvents : cityEvents;
  const hasMore = searchTerm.trim().length >= 2 ? searchHasMore : cityEventsHasMore;
  const loading = cityIdLoading || searchLoading || cityEventsLoading;
  const error = cityIdError || searchError || cityEventsError;
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
    navigate('/create-event');
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

  if (loading && events.length === 0) {
    return <LoadingSpinner text="Loading events..." />;
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
    <div className="selection-container">
      <header className="selection-header">
        <button onClick={handleBackToDashboard} className="back-button">
          ← Back to Dashboard
        </button>
        <h2>Events in {cityName || 'Unknown'}</h2>
        <div className="dashboard-actions">
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
        <button className="create-button" onClick={handleCreateButton}>
          Create
        </button>
        <div className="search-box">
          <SearchBar
            searchTerm={searchInputValue}
            setSearchTerm={handleSearchInputChange}
          />
        </div>
        <div className="filter-dropdown">
          <FilterDropdown
            filterBy={filterBy}
            handleFilterChange={handleFilterChange}
          />
        </div>
    </div>
      <EventsGrid
        events={events}
        loading={loading}
        hasMore={hasMore}
        onShowMore={handleShowMore}
        cityName={cityName}
      />
    </div>
  );
};

export default EventSelectionPage;