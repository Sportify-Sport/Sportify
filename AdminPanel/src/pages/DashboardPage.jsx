// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import getApiBaseUrl from '../config/apiConfig';
import '../styles/dashboard.css';

const DashboardPage = () => {
  const { currentUser, selectedCity, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
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

  const navigateToEvents = () => {
    navigate('/events');
  };

  const navigateToGroups = () => {
    navigate('/groups');
  };
  
  if (!selectedCity) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">No city selected. Please <button onClick={() => navigate('/select-city')}>select a city</button>.</div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Admin Dashboard</h1>
          <h2>{selectedCity.cityName || `City #${selectedCity.cityId}`}</h2>
        </div>
        
        <div className="dashboard-actions">
          <div className="user-info">
            <span>Welcome, {currentUser?.name}</span>
            <button onClick={handleChangeCity} className="change-city-btn">
              Change City
            </button>
            <button onClick={logout} className="logout-btn">
              Log Out
            </button>
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <div className="dashboard-content">
        {loading ? (
          <div className="loading-spinner">Loading dashboard data...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="stats-cards">
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
  );
};

export default DashboardPage;
