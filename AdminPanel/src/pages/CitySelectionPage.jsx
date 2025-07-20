import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import getApiBaseUrl from '../config/apiConfig';
import getCityNameById from '../services/locationService';
import { AUTH_ROUTES } from '../constants/authConstants';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/auth.css';

const CitySelectionPage = () => {
  const [cities, setCities] = useState([]);
  const [citiesWithNames, setCitiesWithNames] = useState([]);
  const [citiesMap, setCitiesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, selectCity, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch cities that the admin can manage
  useEffect(() => {
    const fetchManagedCities = async () => {
      if (!currentUser) return;

      try {
        const token = localStorage.getItem('adminAccessToken');
        const response = await fetch(`${getApiBaseUrl()}/api/AdminCity/managed-cities`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch managed cities');
        }

        const data = await response.json();
        setCities(data);
      } catch (err) {
        console.error("Error fetching cities:", err);
        setError("Failed to load managed cities. Please try again.");
      }
    };

    fetchManagedCities();
  }, [currentUser]);

  // Fetch city names for each city ID
  useEffect(() => {
    const fetchCityNames = async () => {
      if (!cities.length) {
        setLoading(false);
        return;
      }

      try {
        const citiesWithNamesArray = await Promise.all(
          cities.map(async (city) => {
            const cityName = await getCityNameById(city.cityId, citiesMap, setCitiesMap);
            return { ...city, cityName };
          })
        );

        setCitiesWithNames(citiesWithNamesArray);
      } catch (err) {
        console.error("Error fetching city names:", err);
        // Fall back to showing city IDs if names can't be fetched
        setCitiesWithNames(cities.map(city => ({
          ...city,
          cityName: `City #${city.cityId}`
        })));
      } finally {
        setLoading(false);
      }
    };

    if (cities.length) {
      fetchCityNames();
    }
  }, [cities]);

  const handleCitySelect = (city) => {
    selectCity(city);
    navigate(AUTH_ROUTES.DASHBOARD);
  };

  // Show loading indicator
  if (loading) {
    return <LoadingSpinner text="Loading Cities..." />;
  }

  return (
    <div className="city-selection-container">
      <div className="city-selection-card">
        <div className="auth-header">
          <h2>Select a City to Manage</h2>
          <ThemeToggle />
        </div>

        <p className="welcome-text">Welcome, {currentUser?.name || 'Administrator'}</p>

        {/* Super Admin Actions */}
        {currentUser?.isSuperAdmin && (
          <div className="superadmin-actions" style={{ marginBottom: '1rem' }}>
            <button
              className="select-button"
              onClick={() => navigate(AUTH_ROUTES.MANAGE_CITY_ORGANIZERS)}
              style={{ marginRight: '1rem' }}
            >
              Manage City Organizers
            </button>
            <button
              className="select-button"
              onClick={() => navigate(AUTH_ROUTES.MANAGE_SPORTS)}
            >
              Manage Sports
            </button>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {citiesWithNames.length === 0 && !error ? (
          <div className="no-cities-message">
            <p>You don't have any cities assigned to manage.</p>
            <button className="auth-button" onClick={logout}>Log Out</button>
          </div>
        ) : (
          <>
            <div className="cities-grid">
              {citiesWithNames.map(city => (
                <div
                  key={city.cityId}
                  className="city-card"
                  onClick={() => handleCitySelect(city)}
                >
                  <h3>{city.cityName}</h3>
                  <button className="select-button">Select</button>
                </div>
              ))}
            </div>

            <div className="logout-container">
              <button className="text-button" onClick={logout}>Log Out</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CitySelectionPage;
