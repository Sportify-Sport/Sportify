import React from 'react';
import getApiBaseUrl from '../../config/apiConfig';

const GroupDetailsCard = ({ group, onDeleteClick, onToggleAdminSearch, showAdminSearch }) => {
  return (
    <div className="group-card">
      <div className="group-content">
        <div className="group-image-container">
          <img
            src={`${getApiBaseUrl()}/images/${group?.groupImage}`}
            alt={group?.groupName}
            className="group-image"
            loading="lazy"
          />
        </div>
        <div className="group-info">
          <h2>Group Information</h2>
          <p>{group?.description || 'No description available'}</p>

           <div className="group-info-grid">
             {[
              { label: 'City', value: group?.cityName },
              { label: 'Sport', value: group?.sportName },
              { label: 'Members', value: `${group?.totalMembers}/${group?.maxMemNum}` },
              { label: 'Minimum Age', value: group?.minAge },
              { label: 'Gender', value: group?.gender },
              { label: 'Founded', value: new Date(group?.foundedAt).toLocaleDateString() }
            ].map((item, index) => (
              <div className="group-info-item" key={index}>
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
          <div className="admin-info">
            <img
              src={`${getApiBaseUrl()}/images/${group?.groupAdminImage}`}
              alt={group?.groupAdminName}
              className="admin-image"
              loading="lazy"
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