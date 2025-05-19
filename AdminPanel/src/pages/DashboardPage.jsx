// src/pages/DashboardPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/dashboard.css';

const DashboardPage = () => {
  const { currentUser, selectedCity, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleChangeCity = () => {
    navigate('/select-city');
  };
  
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Admin Dashboard</h1>
          <h2>{selectedCity?.cityName || 'No city selected'}</h2>
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
        <p>Dashboard content for {selectedCity?.cityName} goes here</p>
      </div>
    </div>
  );
};

export default DashboardPage;
