// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import CitySelectionPage from './pages/CitySelectionPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import GroupSelectionPage from './pages/groupPages/GroupSelectionPage'
import CreateGroupPage from './pages/groupPages/CreateGroupPage';
import GroupDetailsPage from './pages/groupPages/GroupDetailsPage';
import EventSelectionPage from './pages/eventPages/EventSelectionPage';
import CreateEventPage from './pages/eventPages/CreateEventPage';
import EventDetailsPage from './pages/eventPages/EventDetailsPage';
import './styles/global.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <div className="app-container">
          <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route path="/select-city" element={
            <PrivateRoute requiresCity={false}>
              <CitySelectionPage />
            </PrivateRoute>
          } />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } />
          
          <Route path="/group/:cityId" element={
            <PrivateRoute>
              <GroupSelectionPage />
            </PrivateRoute>
          } />

          <Route path="/create-group" element={
            <PrivateRoute>
              < CreateGroupPage />
            </PrivateRoute>
          } />
          
          <Route path="/group-details/:cityId/:groupId" element={
            <PrivateRoute>
              < GroupDetailsPage />
            </PrivateRoute>
          } />

          <Route path="/event/:cityId" element={
            <PrivateRoute>
              <EventSelectionPage />
            </PrivateRoute>
          } />

          <Route path="/create-event" element={
            <PrivateRoute>
              < CreateEventPage />
            </PrivateRoute>
          } />

          <Route path="/event-details/:cityId/:eventId" element={
            <PrivateRoute>
              < EventDetailsPage />
            </PrivateRoute>
          } />

          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;