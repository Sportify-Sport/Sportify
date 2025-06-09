import React from 'react';
import getApiBaseUrl from '../config/apiConfig';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminSearch = ({
  showAdminSearch,
  adminSearchTerm,
  setAdminSearchTerm,
  adminResults,
  adminLoading,
  adminError,
  selectedAdmin,
  handleSelectAdmin,
  handleChangeAdmin,
}) => {
  return (
    <div className={`admin-search-container ${showAdminSearch ? 'visible' : ''}`}>
      <h2>Change Group Admin</h2>
      <div className="search-bar-container">
        <input
          type="text"
          value={adminSearchTerm}
          onChange={(e) => setAdminSearchTerm(e.target.value)}
          placeholder="Search admins by email or ID..."
          className="search-input"
        />
        <button
          className="change-admin-btn"
          onClick={handleChangeAdmin}
          disabled={!selectedAdmin || adminSearchTerm.trim().length === 0}
        >
          Change Admin
        </button>
      </div>
      {adminError && (
        <div className={`admin-message ${adminError.isSuccess ? 'success' : 'error'}`}>
          {adminError.message}
        </div>
      )}
      {adminLoading && <LoadingSpinner text="Loading admins..." />}
      <div className="admin-results-grid responsive-grid">
        {adminResults.map((admin) => (
          <div
            key={admin.userId}
            className={`admin-card ${selectedAdmin?.userId === admin.userId ? 'selected' : ''}`}
            onClick={() => handleSelectAdmin(admin)}
          >
            <img
              src={`${getApiBaseUrl()}/images/${admin.profileImage}`}
              alt={admin.fullName}
              className="admin-image"
            />
            <p><strong>Name:</strong> {admin.fullName}</p>
            <p><strong>Email:</strong> {admin.email}</p>
            <p><strong>Gender:</strong> {admin.gender === 'F' ? 'Female' : 'Male'}</p>
            <p><strong>City:</strong> {admin.cityName}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSearch;