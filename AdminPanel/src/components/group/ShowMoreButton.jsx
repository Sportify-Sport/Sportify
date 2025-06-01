import React from 'react';

const ShowMoreButton = ({ onClick, hasMore  }) => {
   if (!hasMore) return null; 
  return (
    <button
      className="show-more-button"
      onClick={onClick}
    >
      Show More
    </button>
  );
};

export default ShowMoreButton;