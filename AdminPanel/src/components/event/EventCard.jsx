import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SPORT_TYPES } from '../../constants/sportTypes';
import { getImageUrl } from '../../utils/imageUtils';

const EventCard = memo(({ event, cityName }) => {
  const navigate = useNavigate();

  if (!event) {
    return <div className="item-card">Invalid event data</div>;
  }

  const imageUrl = getImageUrl(event.eventImage || 'default_event.png');

  const handleCardClick = () => {
    navigate(`/event-details/${event.cityId}/${event.eventId}`, {
      state: { cityName, cityId: event.cityId },
    });
  };

  return (
    <div className="item-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <img
        src={imageUrl}
        alt={event.eventName || 'Event'}
        className="item-image"
      />
      <div className="item-details">
        <h3>{event.eventName || 'Unnamed Event'}</h3>
        <p><strong>City:</strong> {cityName || 'Unknown'}</p>
        <p><strong>Sport:</strong> {SPORT_TYPES[event.sportId] || 'Unknown'}</p>
        <p><strong>Gender:</strong> {event.gender || 'N/A'}</p>
        <p>
          <strong>Teams Event:</strong>{' '}
          <span className={event.requiresTeams ? 'icon-true' : 'icon-false'}>
            {event.requiresTeams ? '✔' : '✘'}
          </span>
        </p>
        <p>
          <strong>Public:</strong>{' '}
          <span className={event.isPublic ? 'icon-true' : 'icon-false'}>
            {event.isPublic ? '✔' : '✘'}
          </span>
        </p>
        <p>
          <strong>Location:</strong>{' '}
          <span className="location-icon">📍</span> {event.locationName || 'Unknown'}
        </p>
        <p>
          <strong>Date:</strong>{' '}
          {event.startDatetime ? new Date(event.startDatetime).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }) : 'N/A'}
        </p>
        <button
          className="details-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
        >
          Details
        </button>
      </div>
    </div>
  );
});

export default EventCard;