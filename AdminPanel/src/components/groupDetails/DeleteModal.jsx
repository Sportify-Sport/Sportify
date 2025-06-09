import React from 'react';

const DeleteModal = ({ showDeleteModal, groupName, onConfirm, onCancel }) => {
  if (!showDeleteModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete {groupName}?</p>
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

export default DeleteModal;