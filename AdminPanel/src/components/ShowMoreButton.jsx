import React from 'react';

const ShowMoreButton = ({ onClick, hasMore, isLoading  }) => {
   if (!hasMore) return null; 
  return (
    <div className="show-more-container">
    <button
      className={`show-more-button ${isLoading ? 'loading' : ''}`}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : 'Show More'}
    </button>
    </div>
  );
};

export default ShowMoreButton;