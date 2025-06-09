import React from 'react';
import getApiBaseUrl from '../config/apiConfig';

const GroupDetailsCard = ({ group, onDeleteClick, onToggleAdminSearch, showAdminSearch }) => {
  return (
    <div className="group-card">
      <div className="group-content">
        <div className="group-image-container">
          <img
            src={`${getApiBaseUrl()}/images/${group?.groupImage}`}
            alt={group?.groupName}
            className="group-image"
          />
        </div>
        <div className="group-info">
          <h2>Group Information</h2>
          <p>{group?.description || 'No description available'}</p>
          <div className="group-info-grid">
            <div className="group-info-item">
              <strong>City</strong>
              <span>{group?.cityName}</span>
            </div>
            <div className="group-info-item">
              <strong>Sport</strong>
              <span>{group?.sportName}</span>
            </div>
            <div className="group-info-item">
              <strong>Members</strong>
              <span>{group?.totalMembers}/{group?.maxMemNum}</span>
            </div>
            <div className="group-info-item">
              <strong>Minimum Age</strong>
              <span>{group?.minAge}</span>
            </div>
            <div className="group-info-item">
              <strong>Gender</strong>
              <span>{group?.gender}</span>
            </div>
            <div className="group-info-item">
              <strong>Founded</strong>
              <span>{new Date(group?.foundedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="admin-info">
            <img
              src={`${getApiBaseUrl()}/images/${group?.groupAdminImage}`}
              alt={group?.groupAdminName}
              className="admin-image"
            />
            <div>
              <strong>Group Admin</strong>
              <p>{group?.groupAdminName}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="group-actions">
        <button className="delete-btn" onClick={onDeleteClick}>
          Delete Group
        </button>
        <button className="edit-admin-btn" onClick={onToggleAdminSearch}>
          {showAdminSearch ? 'Cancel Edit' : 'Change Admin'}
        </button>
      </div>
    </div>
  );
};

export default GroupDetailsCard;