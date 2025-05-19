// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AUTH_ROUTES } from '../constants/authConstants';

const PrivateRoute = ({ children, requiresCity = true }) => {
  const { currentUser, selectedCity, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // Not logged in
  if (!currentUser) {
    return <Navigate to={AUTH_ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Logged in but no city selected (and city is required)
  if (requiresCity && !selectedCity && location.pathname !== AUTH_ROUTES.CITY_SELECTION) {
    return <Navigate to={AUTH_ROUTES.CITY_SELECTION} replace />;
  }

  return children;
};

export default PrivateRoute;
