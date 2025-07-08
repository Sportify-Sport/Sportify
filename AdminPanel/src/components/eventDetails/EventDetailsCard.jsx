import React from 'react';
import { SPORT_TYPES } from '../../constants/sportTypes';
import getApiBaseUrl from '../../config/apiConfig';

const EventDetailsCard = ({ event, onDeleteClick, onToggleAdminSearch, showAdminSearch, onEditClick }) => {
  // Format date to MM/DD/YYYY HH:MM
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="group-details-card">
      <div className="group-content">
        <div className="group-image-container">
          <img
            src={`${getApiBaseUrl()}/images/${event.eventImage}`}
            alt={event.eventName}
            className="group-image"
            loading="lazy"
          />
        </div>
        <div className="group-info">
          <h2>{event.eventName}</h2>
          <p className="group-description">{event.description}</p>
          <div className="group-info-grid">
            <div className="group-info-item">
              <strong>Sport</strong>
              <span>{SPORT_TYPES[event.sportId] || 'Unknown'}</span>
            </div>
            <div className="group-info-item">
              <strong>Location</strong>
              <span>{event.locationName}</span>
            </div>
            <div className="group-info-item">
              <strong>City</strong>
              <span>{event.cityName}</span>
            </div>
            <div className="group-info-item">
              <strong>Start Date</strong>
              <span>{formatDate(event.startDatetime)}</span>
            </div>
            <div className="group-info-item">
              <strong>End Date</strong>
              <span>{formatDate(event.endDatetime)}</span>
            </div>
            <div className="group-info-item">
              <strong>Gender</strong>
              <span>{event.gender}</span>
            </div>
            <div className="group-info-item">
              <strong>Minimum Age</strong>
              <span>{event.minAge}</span>
            </div>
            <div className="group-info-item">
              <strong>Requires Teams</strong>
              <span>{event.requiresTeams ? 'Yes' : 'No'}</span>
            </div>
            <div className="group-info-item">
              <strong>Max Participants</strong>
              <span>{event.maxParticipants}</span>
            </div>
            <div className="group-info-item">
              <strong>Participants</strong>
              <span>{event.participantsNum}</span>
            </div>
          </div>
          <div className="admin-info">
            <img
              src={`${getApiBaseUrl()}/images/${event.eventAdminImage}`}
              alt={event.eventAdminName}
              className="admin-image"
            />
            <div>
              <strong>Admin</strong>
              <p>{event.eventAdminName}</p>
            </div>
          </div>
          <div className="group-actions">
            <button onClick={onDeleteClick} className="delete-btn">
              Delete Event
            </button>
            <button onClick={onToggleAdminSearch} className="change-admin-btn">
              {showAdminSearch ? 'Cancel Admin Change' : 'Change Admin'}
            </button>
            <button onClick={onEditClick} className="edit-details-btn">
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsCard;