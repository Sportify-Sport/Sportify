import React from 'react';

const ShowMoreButton = ({ onClick, disabled }) => {
  return (
    <button
      className="show-more-button"
      onClick={onClick}
      disabled={disabled}
    >
      Show More
    </button>
  );
};

export default ShowMoreButton;