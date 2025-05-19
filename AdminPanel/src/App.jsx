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
import './styles/global.css';
//import './styles/App.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
          
          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;