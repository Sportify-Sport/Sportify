// src/components/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../hooks/useTheme';
import '../styles/theme.css';

const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();
  
  return (
    <div className="theme-toggle-container">
      <label className="theme-toggle">
        <input
          type="checkbox"
          checked={darkMode}
          onChange={toggleTheme}
          aria-label="Toggle dark mode"
        />
        <span className="toggle-slider">
          <span className="toggle-icon">
            {darkMode ? '🌙' : '☀️'}
          </span>
        </span>
      </label>
    </div>
  );
};

export default ThemeToggle;
