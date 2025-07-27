// src/components/actionComponents/ErrorDialog.jsx
import React from 'react';

const ErrorDialog = ({ message, errors, onClose }) => {
  return (
    <div className="confirmation-dialog">
      <div className="dialog-content">
        <h3 style={{ color: 'red' }}>Error</h3>
        {errors && Object.keys(errors).length > 0 && (
          <ul>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        )}
        <div className="dialog-buttons" style={{ marginTop: '20px' }}>
          <button onClick={onClose} className="confirm-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDialog;