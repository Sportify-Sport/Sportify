import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useGroupDetails from '../../hooks/groupDetailsHooks/useGroupDetails';
import useAdminSearch from '../../hooks/useAdminSearch';
import useGroupNavigation from '../../hooks/groupDetailsHooks/useGroupNavigation'
import GroupDetailsCard from '../../components/groupDetails/GroupDetailsCard';
import AdminSearch from '../../components/groupDetails/AdminSearch';
import DeleteModal from '../../components/groupDetails/DeleteModal';
import ChangeAdminModal from '../../components/groupDetails/ChangeAdminModal';
import ThemeToggle from '../../components/ThemeToggle';
import getApiBaseUrl from '../../config/apiConfig';
import LoadingSpinner from '../../components/LoadingSpinner'
import '../../styles/globalPagesStyles/detailsPages.css';
const GroupDetailsPage = () => {
  const { groupId, cityId } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cityName = location.state?.cityName || 'Unknown';
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdminSearch, setShowAdminSearch] = useState(false);
  const [showChangeAdminModal, setShowChangeAdminModal] = useState(false);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const { navigateToGroupLogs } = useGroupNavigation(cityId, cityName, logout);

  const { group, groupLoading, groupError, setGroup } = useGroupDetails(groupId, cityId, cityName);
  const { adminResults, adminLoading, adminError, setAdminError, selectedAdmin, setSelectedAdmin, handleSelectAdmin } =
    useAdminSearch(cityId, cityName, adminSearchTerm);

  const handleDeleteGroup = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await fetch(`${getApiBaseUrl()}/api/AdminGroups/${cityId}/group/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      navigate(`/group/${cityId}`, { state: { cityName } });
    } catch (err) {
      console.error('Error deleting group:', err);
      setGroup((prev) => ({ ...prev, error: 'Failed to delete group' }));
    } finally {
      setShowDeleteModal(false);
    }
  }, [cityId, cityName, groupId, navigate, setGroup]);

  const handleChangeAdmin = useCallback(async () => {
    if (!selectedAdmin) {
      setAdminError({ message: 'Please select an admin', isSuccess: false });
      return;
    }

    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await fetch(
        `${getApiBaseUrl()}/api/AdminGroups/${cityId}/change-admin/${groupId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: selectedAdmin.userId }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to change admin');
      }

      setGroup((prev) => ({
        ...prev,
        groupAdminId: selectedAdmin.userId,
        groupAdminName: selectedAdmin.fullName,
        groupAdminImage: selectedAdmin.profileImage,
      }));

      setAdminError({ message: data.message || 'Admin changed successfully', isSuccess: true });

      setTimeout(() => {
        setAdminResults([]);
        setAdminSearchTerm('');
        setSelectedAdmin(null);
        setShowAdminSearch(false);
      }, 2000);
    } catch (err) {
      setAdminError({ message: err.message || 'Failed to change admin', isSuccess: false });
    } finally {
      setShowChangeAdminModal(false);
    }
  }, [cityId, groupId, selectedAdmin, setAdminError, setGroup]);

  const handleBack = useCallback(() => {
    navigate(`/group/${cityId}`, { state: { cityName } });
  }, [cityId, cityName, navigate]);

  const toggleAdminSearch = useCallback(() => {
    setShowAdminSearch((prev) => !prev);
    if (showAdminSearch) {
      setAdminSearchTerm('');
      setSelectedAdmin(null);
      setShowChangeAdminModal(false);
    }
  }, [showAdminSearch, setSelectedAdmin]);

  const handleChangeAdminClick = useCallback(() => {
    if (!selectedAdmin) {
      setAdminError({ message: 'Please select an admin', isSuccess: false });
      return;
    }
    setShowChangeAdminModal(true);
  }, [selectedAdmin, setAdminError]);

  if (groupLoading) {
    return <LoadingSpinner text="Loading group details..." />;
  }

  if (groupError) {
    return (
      <div className="error-container">
        <p>{groupError}</p>
        <button onClick={handleBack}>Back to Groups</button>
      </div>
    );
  }


  return (
    <div className="group-details-container">
      <header className="group-details-header">
        <button onClick={handleBack} className="back-button">
          ← Back to Groups
        </button>
        <h1>{group?.groupName}</h1>
        <div className="dashboard-actions">
          <ThemeToggle />
          <button onClick={() => navigateToGroupLogs(groupId)} className="change-city-btn">
            View Group Logs
          </button>
          <button onClick={logout} className="logout-btn">
            Log Out
          </button>
        </div>
      </header>

      <GroupDetailsCard
        group={group}
        onDeleteClick={() => setShowDeleteModal(true)}
        onToggleAdminSearch={toggleAdminSearch}
        showAdminSearch={showAdminSearch}
      />

      <AdminSearch
        showAdminSearch={showAdminSearch}
        adminSearchTerm={adminSearchTerm}
        setAdminSearchTerm={setAdminSearchTerm}
        adminResults={adminResults}
        adminLoading={adminLoading}
        adminError={adminError}
        selectedAdmin={selectedAdmin}
        handleSelectAdmin={handleSelectAdmin}
        handleChangeAdmin={handleChangeAdminClick}
      />

      <DeleteModal
        showDeleteModal={showDeleteModal}
        groupName={group?.groupName}
        onConfirm={handleDeleteGroup}
        onCancel={() => setShowDeleteModal(false)}
      />

      <ChangeAdminModal
        showChangeAdminModal={showChangeAdminModal}
        selectedAdmin={selectedAdmin}
        groupName={group?.groupName}
        onConfirm={handleChangeAdmin}
        onCancel={() => setShowChangeAdminModal(false)}
      />
    </div>
  );
};

export default GroupDetailsPage;