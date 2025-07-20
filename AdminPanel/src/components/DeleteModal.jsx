import React from 'react';
import '../styles/modal.css';

const DeleteModal = ({ showDeleteModal, organizerName, onConfirm, onCancel }) => {
  if (!showDeleteModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Confirm Remove</h2>
        <p>Are you sure you want to remove {organizerName} from this city?</p>
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