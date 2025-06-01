import React, { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import '../styles/theme.css';

const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
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
          <span className={`toggle-icon moon ${darkMode ? 'hidden' : ''}`}>🌙</span>
          <span className={`toggle-icon sun ${!darkMode ? 'hidden' : ''}`}>☀️</span>
        </span>
      </label>
    </div>
  );
};

export default ThemeToggle;