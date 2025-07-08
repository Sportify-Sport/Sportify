import React, { useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useEventDetails from '../../hooks/eventDetailsHooks/useEventDetails';
import useAdminSearch from '../../hooks/useAdminSearch';
import useEventDelete from '../../hooks/eventDetailsHooks/useEventDelete';
import useEventChangeAdmin from '../../hooks/eventDetailsHooks/useEventChangeAdmin';
import useEventNavigation from '../../hooks/eventDetailsHooks/useEventNavigation';
import EventDetailsCard from '../../components/eventDetails/EventDetailsCard';
import AdminSearch from '../../components/groupDetails/AdminSearch';
import DeleteModal from '../../components/groupDetails/DeleteModal';
import ChangeAdminModal from '../../components/groupDetails/ChangeAdminModal';
import EditDetailsModal from '../../components/eventDetails/EditDetailsModal';
import ThemeToggle from '../../components/ThemeToggle';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/globalPagesStyles/detailsPages.css';

const EventDetailsPage = () => {
  const { eventId, cityId } = useParams();
  const { logout } = useAuth();
  const { state: { cityName = 'Unknown' } = {} } = useLocation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdminSearch, setShowAdminSearch] = useState(false);
  const [showChangeAdminModal, setShowChangeAdminModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const { navigateToEventLogs } = useEventNavigation(cityId, cityName, logout);

  const { event, eventLoading, eventError, setEvent, updateEventImage, refreshEventDetails } = useEventDetails(eventId, cityId, cityName);
  const { adminResults, adminLoading, adminError, setAdminError, selectedAdmin, setSelectedAdmin, handleSelectAdmin, setAdminResults  } =
    useAdminSearch(cityId, cityName, adminSearchTerm);
  const { handleDeleteEvent } = useEventDelete(cityId, eventId, setEvent, useEventNavigation(cityId, cityName, logout).handleBack);
  const { handleChangeAdmin } = useEventChangeAdmin(
    cityId,
    eventId,
    selectedAdmin,
    setEvent,
    setAdminError,
    setAdminResults,
    setAdminSearchTerm,
    setSelectedAdmin,
    setShowAdminSearch,
    setShowChangeAdminModal
  );
  const { handleBack, handleLogout } = useEventNavigation(cityId, cityName, logout);

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

  	
  const handleUpdate = useCallback((updatedEntity) => {
    updateEventImage(updatedEntity);
    if (updatedEntity.eventImage) {
      refreshEventDetails();
    }
    setShowEditModal(false);
  }, [updateEventImage, refreshEventDetails]);

  if (eventLoading) {
    return <LoadingSpinner text="Loading event details..." />;
  }

  if (eventError) {
    return (
      <div className="error-container">
        <p>{eventError}</p>
        <button onClick={handleBack}>Back to Events</button>
      </div>
    );
  }

  return (
    <div className="group-details-container">
      <header className="group-details-header">
        <button onClick={handleBack} className="back-button">
          ← Back to Events
        </button>
        <h1>{event?.eventName}</h1>
        <div className="dashboard-actions">
          <ThemeToggle />
          <button onClick={() => navigateToEventLogs(eventId)} className="change-city-btn">
            View Event Logs
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Log Out
          </button>
        </div>
      </header>

      <EventDetailsCard
        event={event}
        onDeleteClick={() => setShowDeleteModal(true)}
        onToggleAdminSearch={toggleAdminSearch}
        showAdminSearch={showAdminSearch}
        onEditClick={() => setShowEditModal(true)}        
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
        groupName={event?.eventName}
        onConfirm={handleDeleteEvent}
        onCancel={() => setShowDeleteModal(false)}
      />

      <ChangeAdminModal
        showChangeAdminModal={showChangeAdminModal}
        selectedAdmin={selectedAdmin}
        groupName={event?.eventName}
        onConfirm={handleChangeAdmin}
        onCancel={() => setShowChangeAdminModal(false)}
      />

      <EditDetailsModal
        showEditModal={showEditModal}
        entity={event}
        entityId={eventId}
        entityType="event"
        onCancel={() => setShowEditModal(false)}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default EventDetailsPage;