import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SPORT_TYPES } from '../../constants/sportTypes';
import { getImageUrl } from '../../utils/imageUtils';

const GroupCard = memo(({ group, cityName }) => {
  const navigate = useNavigate();
  const imageUrl = getImageUrl(group.groupImage);

  const handleCardClick = () => {
    navigate(`/group-details/${group.cityId}/${group.groupId}`, {
      state: { cityName, cityId: group.cityId }
    });
  };
    return (

    <div className="group-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <img 
        src={imageUrl} 
        alt={group.groupName} 
        className="group-image"
      />
      <div className="group-details">
        <h3>{group.groupName}</h3>
        <p><strong>City:</strong> {cityName || 'Unknown'}</p>
        <p><strong>Sport:</strong> {group.sportName || SPORT_TYPES[group.sportId] || group.sportId || 'Unknown'}</p>
        <p><strong>Members:</strong> {group.totalMembers || 0}</p>
        <p><strong>Gender:</strong> {group.gender || 'N/A'}</p>
        <p><strong>Founded:</strong> {new Date(group.foundedAt).toLocaleDateString()}</p>
        <button className="details-btn" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>
          Details
        </button>
      </div>
    </div>
  );
});

export default GroupCard;