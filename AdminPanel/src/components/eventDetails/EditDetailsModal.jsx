import React from 'react';
import useEditDetails from '../../hooks/eventDetailsHooks/useEditDetails';
import '../../styles/globalPagesStyles/detailsPages.css';

const EditDetailsModal = ({ showEditModal, entity, entityId, entityType, onCancel, onUpdate }) => {
  const {
    formData,
    imageFile,
    error,
    isLoading,
    isFormChanged,
    handleInputChange,
    handleImageChange,
    handleSubmit,
  } = useEditDetails(entityId, entityType, entity, onUpdate);

  if (!showEditModal) return null;

  return (
    <div className="edit-modal-overlay">
      <div className="edit-modal-content">
        <h2>Edit {entityType.charAt(0).toUpperCase() + entityType.slice(1)} Details</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="form-group">
            <label htmlFor={`name-${entityId}`}>Name</label>
            <input
              type="text"
              id={`name-${entityId}`}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor={`description-${entityId}`}>Description</label>
            <textarea
              id={`description-${entityId}`}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor={`locationName-${entityId}`}>Location</label>
            <input
              type="text"
              id={`locationName-${entityId}`}
              name="locationName"
              value={formData.locationName}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor={`image-upload-${entityId}`}>Upload New Image</label>
            <input
              type="file"
              id={`image-upload-${entityId}`}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
            />
            {imageFile && <p>Selected file: {imageFile.name}</p>}
          </div>
          {error && <p className="error-message">{error.message}</p>}
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="modal-button cancel-button">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormChanged || isLoading}
              className={`modal-button confirm-button ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? 'Submitting...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDetailsModal;