import React from 'react';
import AdminSearchCard from './AdminSearchCard';
const AdminSearch = ({
  adminSearchTerm,
  onAdminSearch,
  adminUsers,
  adminSearchLoading,
  adminSearchError,
  adminId,
  onAdminSelect,
  error,
}) => {
  const handleInputChange = (e) => {
    onAdminSearch(e.target.value);
  };

  return (
    <div className="form-group admin-search">
      <label htmlFor="adminSearchTerm">Admin</label>
      <input
        type="text"
        id="adminSearchTerm"
        name="adminSearchTerm"
        placeholder="Search admin by email or ID..."
        value={adminSearchTerm}
        onChange={handleInputChange}
        className={error ? 'error' : ''}
      />
      {adminSearchError && <span className="error-text">{adminSearchError}</span>}
      {adminSearchLoading && <div className="loading-text">Searching...</div>}
      {error && <span className="error-text">{error}</span>}
      <div className="responsive-grid">
        {adminUsers.map((user) => (
          <AdminSearchCard
            key={user.userId}
            user={user}
            cityName={user.cityName}
            onSelect={() => onAdminSelect(user.userId)}
            isSelected={adminId === user.userId}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminSearch;