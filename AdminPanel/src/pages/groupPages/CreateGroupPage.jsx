import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateGroupForm from '../../components/createGroup/CreateGroupForm';
import MessageModal from '../../components/createGroup/MessageModal';
import useAdminSearch from '../../hooks/useAdminSearch';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../../components/ThemeToggle';
import '../../styles/groupStyles/createGroup.css';
import '../../styles/groupStyles/admin-card.css';

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { currentUser, selectedCity, loading: authLoading } = useAuth();
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [modalMessage, setModalMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [citiesMap, setCitiesMap] = useState({});

  if (!selectedCity && !authLoading) {
    navigate('/select-city');
    return null;
  }

  const { adminResults: adminUsers, adminLoading: adminSearchLoading, adminError: adminSearchError } = useAdminSearch(
    selectedCity?.cityId,
    selectedCity?.cityName,
    adminSearchTerm,
    citiesMap,
    setCitiesMap
  );

  const handleSubmit = async (data) => {
    try {
      setModalMessage(data.message);
      setIsSuccess(true);
    } catch (error) {
      setModalMessage(error.message || 'Failed to create group');
      setIsSuccess(false);
    }
  };

  const closeModal = () => {
    setModalMessage(null);
    if (isSuccess) {
      navigate(`/group/${selectedCity.cityId}`, { state: { cityName: selectedCity.cityName } });
    }
  };

  const handleAdminSearch = (term) => {
    setAdminSearchTerm(term);
  };

  return (
    <div className="create-group-container">
      <header className="create-group-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>Create New Group</h2>
        <ThemeToggle />
      </header>
      {authLoading ? (
        <div>Loading...</div>
      ) : (
        <CreateGroupForm
          onSuccess={handleSubmit}
          adminUsers={adminUsers}
          adminSearchLoading={adminSearchLoading}
          adminSearchError={adminSearchError}
          onAdminSearch={handleAdminSearch}
          selectedCity={selectedCity}
        />
      )}
      {modalMessage && (
        <MessageModal
          message={modalMessage}
          onClose={closeModal}
          isSuccess={isSuccess}
        />
      )}
    </div>
  );
};

export default CreateGroupPage;