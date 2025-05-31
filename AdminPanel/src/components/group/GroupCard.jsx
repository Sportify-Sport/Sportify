import React from 'react';
import getApiBaseUrl from '../config/apiConfig';
import { SPORT_TYPES } from '../constants/sportTypes';

const GroupCard = ({ group }) => {
  return (
    <div className="group-card">
      <img 
        src={`${getApiBaseUrl()}/images/${group.groupImage}`} 
        alt={group.groupName} 
        className="group-image"
      />
      <div className="group-details">
        <h3>{group.groupName}</h3>
        <p><strong>Sport:</strong> {group.sportName || SPORT_TYPES[group.sportId] || group.sportId}</p>
        <p><strong>Members:</strong> {group.totalMembers}</p>
        <p><strong>Gender:</strong> {group.gender}</p>
        <p><strong>Founded:</strong> {new Date(group.foundedAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default GroupCard;