import React from 'react';

const LoadingSpinner = ({ text = '' }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    {text && <div className="loading-text">{text}</div>}  
    </div>
  );
};

export default LoadingSpinner;