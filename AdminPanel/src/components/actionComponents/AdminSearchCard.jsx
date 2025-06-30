import React from 'react';
import getApiBaseUrl from '../../config/apiConfig';

const AdminSearchCard = ({ user, cityName, onSelect, isSelected }) => {
  const handleClick = () => {
    onSelect(user.userId);
  };

  return (
    <div
      className={`admin-card ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <img
        src={`${getApiBaseUrl()}/images/${user.profileImage}`}
        alt={user.fullName}
        className="admin-image"
        onError={(e) => {
          e.target.src = `${getApiBaseUrl()}/images/default_profile.png`;
        }}
      />
      <div className="admin-details">
        <h3>{user.fullName}</h3>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Gender:</strong> {user.gender === 'F' ? 'Female' : 'Male'}</p>
        <p><strong>City:</strong> {cityName}</p>
        {isSelected && <div className="selected-badge">✓ Selected</div>}
      </div>
    </div>
  );
};

export default AdminSearchCard;