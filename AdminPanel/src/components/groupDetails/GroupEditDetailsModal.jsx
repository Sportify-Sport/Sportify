import React, { useEffect } from 'react';
import useGroupEditDetails from '../../hooks/groupDetailsHooks/useGroupEditDetails';
import '../../styles/globalPagesStyles/detailsPages.css';

const GroupEditDetailsModal = ({ showEditModal, entity, entityId, entityType, onCancel, onUpdate }) => {
  const {
    formData,
    imageFile,
    error,
    isLoading,
    isFormChanged,
    handleInputChange,
    handleImageChange,
    handleSubmit,
    initializeFormData
  } = useGroupEditDetails(entityId, entityType, entity, onUpdate);

  useEffect(() => {
    if (showEditModal && entity) {
      initializeFormData({
        name: entity.groupName || '',
        description: entity.description || ''
      });
    }
  }, [showEditModal, entity, initializeFormData]);

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
              value={formData.name || ''}
              onChange={handleInputChange}
              required
              placeholder="Enter group name"
            />
          </div>
          <div className="form-group">
            <label htmlFor={`description-${entityId}`}>Description</label>
            <textarea
              id={`description-${entityId}`}
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="Enter group description"
              rows="4"
            />
          </div>
          <div className="form-group">
            <label htmlFor={`image-upload-${entityId}`}>Upload New Image</label>
            <input
              type="file"
              id={`image-upload-${entityId}`}
              accept="image/png,image/jpeg,image/webp"
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

export default GroupEditDetailsModal;