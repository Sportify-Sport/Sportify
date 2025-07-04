// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import getApiBaseUrl from '../config/apiConfig';
import { AUTH_ROUTES } from '../constants/authConstants';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/dashboard.css';

const DashboardPage = () => {
  const { currentUser, selectedCity, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const cityId = selectedCity?.cityId;
  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!selectedCity) return;
      
      try {
        const token = localStorage.getItem('adminAccessToken');
        const response = await fetch(`${getApiBaseUrl()}/api/AdminCity/dashboard-stats/${selectedCity.cityId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, [selectedCity]);
  
  const handleChangeCity = () => {
    navigate('/select-city');
  };

  const handleCityLogsClick = () => {
    if (cityId) {
      navigate(AUTH_ROUTES.LOGS.replace(':type', 'city').replace(':id', cityId));
    } else {
      console.error('No city selected');
    }
  };

  const navigateToEvents = () => {
    navigate(`/event/${selectedCity.cityId}`, {
    state: {
      cityName: selectedCity.cityName,
    },
  });
  };

  const navigateToGroups = () => {
    navigate(`/group/${selectedCity.cityId}`, { 
    state: { 
      cityName: selectedCity.cityName 
    } 
  });
  };
  
  if (!selectedCity) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner text="No city selected. Please select a city." />
        <button onClick={() => navigate('/select-city')}>Select a city</button>
      </div>
    );
  }
  
  return (
    <div className="page-wrapper">
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-row">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <div className="dashboard-actions">
            <ThemeToggle />
            <button className="change-city-btn" onClick={handleCityLogsClick}>
              City Logs
            </button>
            <button onClick={handleChangeCity} className="change-city-btn">
              Change City
            </button>
            <button onClick={logout} className="logout-btn">
              Log Out
            </button>
          </div>
        </div>
        <h2 className="city-name">{selectedCity.cityName || `City #${selectedCity.cityId}`}</h2>
      </header>

      <div className="dashboard-content">
        {loading ? (
          <LoadingSpinner text= "Loading Dashboard..." />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="stats-cards responsive-grid">
              <div className="stat-card">
                <h3>Events</h3>
                <p className="stat-value">{stats?.eventsCount || 0}</p>
                <p className="stat-label">Total Events</p>
              </div>
              <div className="stat-card">
                <h3>Active Events</h3>
                <p className="stat-value">{stats?.activeEventsCount || 0}</p>
                <p className="stat-label">Currently Running</p>
              </div>
              <div className="stat-card">
                <h3>Groups</h3>
                <p className="stat-value">{stats?.groupsCount || 0}</p>
                <p className="stat-label">Total Groups</p>
              </div>
              <div className="stat-card">
                <h3>Participants</h3>
                <p className="stat-value">{stats?.totalParticipants || 0}</p>
                <p className="stat-label">In All Events</p>
              </div>
              <div className="stat-card">
                <h3>Group Members</h3>
                <p className="stat-value">{stats?.totalGroupMembers || 0}</p>
                <p className="stat-label">In All Groups</p>
              </div>
            </div>
            
            <div className="main-navigation">
              <div className="nav-card" onClick={navigateToEvents}>
                <h3>Events</h3>
                <p>Manage events for {selectedCity.cityName || `City #${selectedCity.cityId}`}</p>
                <div className="card-footer">
                  <span>{stats?.eventsCount || 0} Events</span>
                  <button>Manage</button>
                </div>
              </div>
              
              <div className="nav-card" onClick={navigateToGroups}>
                <h3>Groups</h3>
                <p>Manage groups for {selectedCity.cityName || `City #${selectedCity.cityId}`}</p>
                <div className="card-footer">
                  <span>{stats?.groupsCount || 0} Groups</span>
                  <button>Manage</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
};

export default DashboardPage;
