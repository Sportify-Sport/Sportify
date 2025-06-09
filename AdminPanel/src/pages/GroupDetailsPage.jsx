import React, { useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useGroupDetails from '../hooks/useGroupDetails';
import useAdminSearch from '../hooks/useAdminSearch';
import useGroupDelete from '../hooks/useGroupDelete';
import useAdminChange from '../hooks/useAdminChange';
import GroupCard from '../components/group/GroupCard';
import AdminSearch from '../components/groupDetails/AdminSearch';
import DeleteModal from '../components/groupDetails/DeleteModal';
import ChangeAdminModal from '../components/groupDetails/ChangeAdminModal';
import '../styles/group-details.css';

const GroupDetailsPage = () => {
  const { groupId, cityId } = useParams();
  const { logout } = useAuth();
  const location = useLocation();
  const cityName = location.state?.cityName || 'Unknown';
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdminSearch, setShowAdminSearch] = useState(false);
  const [showChangeAdminModal, setShowChangeAdminModal] = useState(false);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  const { group, groupLoading, groupError, setGroup } = useGroupDetails(groupId, cityId, cityName);
  const { adminResults, adminLoading, adminError, setAdminError, selectedAdmin, setSelectedAdmin, handleSelectAdmin } =
    useAdminSearch(cityId, cityName, adminSearchTerm);
  const { handleBack, handleLogout } = useGroupNavigation(cityId, cityName, logout);
  const { handleDeleteGroup } = useGroupDelete(cityId, groupId, setGroup, handleBack);
  const { handleChangeAdmin } = useAdminChange(
    cityId,
    groupId,
    selectedAdmin,
    setGroup,
    setAdminError,
    setAdminResults,
    setAdminSearchTerm,
    setSelectedAdmin,
    setShowAdminSearch
  );

  const handleChangeAdminClick = useCallback(() => {
    if (!selectedAdmin) {
      setAdminError({ message: 'Please select an admin', isSuccess: false });
      return;
    }
    setShowChangeAdminModal(true);
  }, [selectedAdmin, setAdminError]);

  const toggleAdminSearch = useCallback(() => {
    setShowAdminSearch((prev) => !prev);
    if (showAdminSearch) {
      setAdminSearchTerm('');
      setSelectedAdmin(null);
      setShowChangeAdminModal(false);
    }
  }, [showAdminSearch, setSelectedAdmin]);

  if (groupLoading) {
    return <LoadingSpinner text="Loading group details..." />;
  }

  if (groupError) {
    return <ErrorContainer error={groupError} onBack={handleBack} />;
  }

  return (
    <div className="group-details-container">
      <GroupDetailsHeader groupName={group?.groupName} onBack={handleBack} onLogout={handleLogout} />

      <GroupCard
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