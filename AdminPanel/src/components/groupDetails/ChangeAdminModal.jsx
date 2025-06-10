import React from 'react';
import getApiBaseUrl from '../../config/apiConfig';

const ChangeAdminModal = ({ showChangeAdminModal, selectedAdmin, groupName, onConfirm, onCancel }) => {
  if (!showChangeAdminModal || !selectedAdmin) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Confirm Admin Change</h2>
        <p>
          Are you sure you want to change the admin of <strong>{groupName}</strong> to{' '}
          <strong>{selectedAdmin.fullName}</strong> ({selectedAdmin.email})?
        </p>
        <div className="admin-info" style={{ margin: '1rem 0' }}>
          <img
            src={`${getApiBaseUrl()}/images/${selectedAdmin.profileImage}`}
            alt={selectedAdmin.fullName}
            className="admin-image"
          />
          <div>
            <p>
              <strong>Gender:</strong> {selectedAdmin.gender === 'F' ? 'Female' : 'Male'}
            </p>
            <p>
              <strong>City:</strong> {selectedAdmin.cityName}
            </p>
          </div>
        </div>
        <div className="modal-buttons">
          <button className="confirm-btn" onClick={onConfirm}>
            Confirm
          </button>
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeAdminModal;