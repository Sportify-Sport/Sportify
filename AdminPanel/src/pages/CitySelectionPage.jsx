// src/pages/CitySelectionPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import getApiBaseUrl from '../config/apiConfig';
import { AUTH_ROUTES } from '../constants/authConstants';
import '../styles/auth.css';

const CitySelectionPage = () => {
  const [cities, setCities] = useState([]);
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
        const response = await fetch(`${getApiBaseUrl()}/api/AdminAuth/admin/managed-cities`, {
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
      } finally {
        setLoading(false);
      }
    };

    fetchManagedCities();
  }, [currentUser]);

  const handleCitySelect = (city) => {
    selectCity(city);
    navigate(AUTH_ROUTES.DASHBOARD);
  };

  // Show loading indicator
  if (loading) {
    return (
      <div className="city-selection-container">
        <div className="loading-spinner">Loading cities...</div>
      </div>
    );
  }

  return (
    <div className="city-selection-container">
      <div className="city-selection-card">
        <div className="auth-header">
          <h2>Select a City to Manage</h2>
          <ThemeToggle />
        </div>
        
        <p className="welcome-text">Welcome, {currentUser?.name || 'Administrator'}</p>
        
        {error && <div className="error-message">{error}</div>}
        
        {cities.length === 0 && !error ? (
          <div className="no-cities-message">
            <p>You don't have any cities assigned to manage.</p>
            <button className="auth-button" onClick={logout}>Log Out</button>
          </div>
        ) : (
          <>
            <div className="cities-grid">
              {cities.map(city => (
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
