// src/pages/CreateEventPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateEventForm from '../../components/createEvent/CreateEventForm';
import MessageModal from '../../components/actionComponents/MessageModal';
import useAdminSearch from '../../hooks/useAdminSearch';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../../components/ThemeToggle';
import '../../styles/globalPagesStyles/createItem.css';
import '../../styles/globalPagesStyles/admin-card.css';

const CreateEventPage = () => {
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
      setModalMessage(error.message || 'Failed to create event');
      setIsSuccess(false);
    }
  };

  const closeModal = () => {
    setModalMessage(null);
    if (isSuccess) {
      navigate(`/event/${selectedCity.cityId}`, { state: { cityName: selectedCity.cityName } });
    }
  };

  const handleAdminSearch = (term) => {
    setAdminSearchTerm(term);
  };

  return (
    <div className="create-container">
      <header className="create-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2>Create New Event</h2>
        <ThemeToggle />
      </header>
      {authLoading ? (
        <div>Loading...</div>
      ) : (
        <CreateEventForm
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

export default CreateEventPage;