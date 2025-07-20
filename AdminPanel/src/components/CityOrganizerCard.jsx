import React from 'react';
import { Trash2 } from 'react-feather';
import getApiBaseUrl from '../config/apiConfig';

export default function CityOrganizerCard({ organizer, cityNames, handleRemove }) {
  return (
    <div className="item-card" style={{ padding: '1rem', width: 270, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <img
        src={`${getApiBaseUrl()}/Images/${organizer.profileImage}`}
        alt={`${organizer.firstName} ${organizer.lastName}`}
        style={{ width: 100, height: 100, borderRadius: '50%', marginBottom: 8, objectFit: 'cover' }}
      />
      <div>
        <strong>Name:</strong> {organizer.firstName} {organizer.lastName}<br />
        <strong>UserID:</strong> {organizer.userId}<br />
        <strong>Email:</strong> {organizer.email}<br />
        <strong>City:</strong> {cityNames[organizer.city.cityId] || organizer.city.englishName} (ID: {organizer.city.cityId})
      </div>
      <button
        className="text-button"
        onClick={handleRemove}
        style={{ color: '#c62828', marginTop: 10 }}
      >
        <Trash2 size={14} style={{ marginRight: 4 }} />Remove
      </button>
    </div>
  );
}