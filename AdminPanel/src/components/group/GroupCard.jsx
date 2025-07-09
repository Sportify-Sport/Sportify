import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SPORT_TYPES } from '../../constants/sportTypes';
import { getImageUrl } from '../../utils/imageUtils';
import getApiBaseUrl from '../../config/apiConfig';

const GroupCard = memo(({ group, cityName }) => {
  const navigate = useNavigate();

  	
  const getSafeImageUrl = () => {
    if (!group.groupImage) {
      return `${getApiBaseUrl()}/images/default_group.png`;
    }
    
    // Check if it's a full URL or just a filename
    if (group.groupImage.startsWith('http') || group.groupImage.includes('/')) {
      return group.groupImage;
    }
    
    // For new groups or when we just have the filename
    return `${getApiBaseUrl()}/images/${group.groupImage}`;
  };
  const imageUrl = getSafeImageUrl();

  const handleCardClick = () => {
    navigate(`/group-details/${group.cityId}/${group.groupId}`, {
      state: { cityName, cityId: group.cityId }
    });
  };
    return (

    <div className="item-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <img 
        src={imageUrl} 
        alt={group.groupName} 
        className="item-image"
        onError={(e) => {
          e.target.src = `${getApiBaseUrl()}/images/default_group.png`;
        }}
      />
      <div className="item-details">
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