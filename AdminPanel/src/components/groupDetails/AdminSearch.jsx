import React from 'react';
import AdminSearchCard from '../../components/actionComponents/AdminSearchCard';
import LoadingSpinner from '../../components/LoadingSpinner';

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
       {!adminLoading && adminResults.length === 0 && adminSearchTerm && (
        <div className="no-results">No admins found</div>
      )}
      <div className="responsive-grid">
        {adminResults.map((admin) => (
          <AdminSearchCard
            key={admin.userId}
            user={admin}
            cityName={admin.cityName}
            onSelect={() => handleSelectAdmin(admin)}
            isSelected={selectedAdmin?.userId === admin.userId}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminSearch;