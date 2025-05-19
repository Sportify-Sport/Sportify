// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/notFound.css';

const NotFoundPage = () => {
  const { currentUser } = useAuth();
  
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-header">
          <h1>404</h1>
          <ThemeToggle />
        </div>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        {currentUser ? (
          <Link to="/dashboard" className="back-link">Go to Dashboard</Link>
        ) : (
          <Link to="/login" className="back-link">Go to Login</Link>
        )}
      </div>
    </div>
  );
};

export default NotFoundPage;
