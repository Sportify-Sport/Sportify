import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import getApiBaseUrl from '../config/apiConfig';
import Modal from '../components/Modal';
import DeleteModal from '../components/DeleteModal';
import '../styles/global.css';
import { Trash2, Plus, RefreshCw, ArrowLeft } from 'react-feather';
import CityOrganizerCard from '../components/CityOrganizerCard';

export default function ManageCityOrganizers() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // State for organizers list and pagination
  const [orgs, setOrgs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({ query: '', city: '', cityId: '' });

  // City search suggestions
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityNames, setCityNames] = useState({});

  // Modal for adding organizer
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCitySuggestions, setModalCitySuggestions] = useState([]);
  const [modalCityInput, setModalCityInput] = useState('');

  // User search in modal
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);

  const abortRef = useRef(null);
  const userAbortRef = useRef(null);

  // Alert
  const [alert, setAlert] = useState(null);
  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Fetch organizers from backend
  const fetchOrganizers = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const token = localStorage.getItem('adminAccessToken');
      const params = new URLSearchParams({
        pageNumber: reset ? '1' : page.toString(),
        pageSize: '20'
      });
      if (filters.query) params.append('query', filters.query);
      if (filters.cityId) params.append('cityId', filters.cityId);
      const res = await fetch(
        `${getApiBaseUrl()}/api/CityOrganizers?${params.toString()}`,
        {
          method: 'GET',
          headers: { Accept: '*/*', Authorization: `Bearer ${token}` },
          signal: abortRef.current.signal
        }
      );
      const data = await res.json();
      if (data.success) {
        setOrgs(prev => reset ? data.organizers : [...prev, ...data.organizers]);
        setHasMore(data.pagination.hasMore);
        setPage(data.pagination.currentPage + 1);
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, loading]);

  // Initial and filter change effect
  useEffect(() => {
    setPage(1);
    fetchOrganizers(true);
  }, [filters]);

  // Infinite scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loading) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        fetchOrganizers();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, fetchOrganizers]);

  // City suggestions (for filters and modal)
  const searchCities = async (query, isModal = false) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const apiUrl = isNaN(query)
      ? `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&q=${encodeURIComponent(query.toLowerCase())}&limit=5`
      : `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${query}}`;
    try {
      const res = await fetch(apiUrl, { signal: abortRef.current.signal });
      const data = await res.json();
      if (data.success) {
        const suggestions = data.result.records.map(r => ({ id: r._id, name: r.city_name_en?.trim() })).filter(r => r.name);
        isModal ? setModalCitySuggestions(suggestions) : setCitySuggestions(suggestions);
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  };

  const fetchCityNameById = async (cityId) => {
    if (!cityId || cityNames[cityId]) return;

    try {
      const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${cityId}}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.result.records.length > 0) {
        const name = data.result.records[0].city_name_en?.trim();
        if (name) {
          setCityNames(prev => ({ ...prev, [cityId]: name }));
        }
      }
    } catch (err) {
      console.error(`Failed to fetch city name for ID ${cityId}`, err);
    }
  };

  // Remove organizer
  const handleRemove = async (o) => {
    setSelectedOrganizer(o);
    setShowDeleteModal(true);
  };

  const confirmRemove = async () => {
    if (!selectedOrganizer) return;
    try {
      const token = localStorage.getItem('adminAccessToken');
      await fetch(
        `${getApiBaseUrl()}/api/CityOrganizers/remove`,
        {
          method: 'DELETE',
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ userId: selectedOrganizer.userId, cityId: selectedOrganizer.city.cityId })
        }
      );
      setOrgs(prev => prev.filter(x => x.userId !== selectedOrganizer.userId || x.city.cityId !== selectedOrganizer.city.cityId));
      showAlert(`Removed ${selectedOrganizer.firstName} ${selectedOrganizer.lastName}`, 'error');
    } catch (err) {
      console.error(err);
    } finally {
      setShowDeleteModal(false);
      setSelectedOrganizer(null);
    }
  };

  // Add organizer
  const handleAdd = async ({ userId, cityId }) => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      await fetch(
        `${getApiBaseUrl()}/api/CityOrganizers/add`,
        {
          method: 'POST',
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ userId, cityId })
        }
      );
      setModalOpen(false);
      setUserQuery('');
      fetchOrganizers(true);
      showAlert(`Added organizer ${userId}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Search users for modal
  const searchUsers = async (query) => {
    if (userAbortRef.current) userAbortRef.current.abort();
    userAbortRef.current = new AbortController();
    if (query.length < 2) return setUserResults([]);
    setUserSearchLoading(true);
    try {
      const token = localStorage.getItem('adminAccessToken');
      const res = await fetch(
        `${getApiBaseUrl()}/api/AdminUsers/search?emailOrId=${encodeURIComponent(query)}`,
        { headers: { Accept: '*/*', Authorization: `Bearer ${token}` }, signal: userAbortRef.current.signal }
      );
      const data = await res.json();
      setUserResults(data || []);
      (data || []).forEach(user => {
        if (user.cityId && !cityNames[user.cityId]) {
          fetchCityNameById(user.cityId);
        }
      });
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      setUserSearchLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={() => window.history.back()} 
                className="change-city-btn"
                style={{ 
                  padding: '8px', 
                  minWidth: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="dashboard-title">Manage City Organizers</h1>
            </div>
            <div className="dashboard-actions">
              <ThemeToggle />
              <button onClick={logout} className="logout-btn">Log Out</button>
            </div>
          </div>
        </header>

        <p style={{ margin: '1rem 0' }}>Welcome, <strong>{currentUser.name}</strong></p>
        {alert && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '0.5rem', background: alert.type === 'success' ? '#e6ffed' : '#ffe6e6', color: alert.type === 'success' ? '#2e7d32' : '#c62828', textAlign: 'center', zIndex: 100 }}>{alert.msg}</div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
          <input
            className="search-box"
            type="text"
            placeholder="Search email…"
            value={filters.query}
            onChange={e => setFilters(f => ({ ...f, query: e.target.value }))}
            style={{
              padding: '12px 16px',
              border: '2px solid var(--border-color)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              background: 'var(--card-bg)',
              color: 'var(--text-color)',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              outline: 'none'
            }}
            onFocus={e => {
              e.target.style.borderColor = '#4f46e5';
              e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1), 0 4px 8px rgba(0,0,0,0.1)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            }}
          />
          <div style={{ position: 'relative' }}>
            <input
              className="search-box"
              type="text"
              placeholder="Search city by name or ID…"
              value={filters.city}
              onChange={e => {
                const q = e.target.value;
                setFilters(f => ({ ...f, city: q }));
                if (q.length >= 2) searchCities(q);
              }}
              style={{
                padding: '12px 16px',
                border: '2px solid var(--border-color)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'var(--card-bg)',
                color: 'var(--text-color)',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                outline: 'none'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#4f46e5';
                e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1), 0 4px 8px rgba(0,0,0,0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
              }}
            />
            {citySuggestions.length > 0 && (
              <ul className="dropdown-list">
                {citySuggestions.map((city, i) => (
                  <li key={i} onClick={() => { 
                    setFilters(f => ({ ...f, city: city.name, cityId: city.id.toString() })); 
                    setCitySuggestions([]); 
                  }}>
                    {city.name} (ID: {city.id})
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button 
            className="change-city-btn" 
            onClick={() => setModalOpen(true)}
          >
            <Plus size={16} style={{ marginRight: 6 }} /> Add Organizer
          </button>
        </div>

        {/* Organizer Cards */}
        <div className="responsive-flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          {orgs.map(o => (
            <CityOrganizerCard
              key={`${o.userId}-${o.city.cityId}`}
              organizer={o}
              cityNames={cityNames}
              handleRemove={() => handleRemove(o)}
            />
          ))}
          {!orgs.length && !loading && <div className="no-results-message">No organizers found.</div>}
        </div>
      </div>

      {/* Add Organizer Modal */}
      {modalOpen && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <h2>Add Organizer</h2>
          <form onSubmit={e => {
            e.preventDefault();
            handleAdd({ userId: Number(userQuery), cityId: Number(modalCityInput) });
          }}>

            {/* User Search */}
            <label>
              Organizer ID or Email:
              <input
                name="id"
                required
                className="auth-input"
                style={{ width: '100%', padding: 6, marginBottom: 10 }}
                value={userQuery}
                onChange={e => { setUserQuery(e.target.value); searchUsers(e.target.value); }}
              />
            </label>
            {userResults.length > 0 && (
              <div className="responsive-flex" style={{ gap: '1rem', marginBottom: 10 }}>
                {userResults.slice(0, 3).map((user) => (
                  <div
                    key={user.userId}
                    className="city-card"
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                    }}
                    onClick={() => {
                      setUserQuery(user.userId.toString());
                      setUserResults([]);
                    }}
                  >
                    <img
                      src={`${getApiBaseUrl()}/images/${user.profileImage}`}
                      alt={user.fullName}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                    <div>
                      <strong>ID:</strong> {user.userId}<br />
                      <strong>Name:</strong> {user.fullName}<br />
                      <strong>Email:</strong> {user.email}<br />
                      <strong>Gender:</strong> {user.gender === 'F' ? 'Female' : 'Male'}<br />
                      <div>
                        <strong>City:</strong>{' '}
                        {cityNames[user.cityId]
                          ? `${cityNames[user.cityId]} (ID: ${user.cityId})`
                          : `ID: ${user.cityId}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* City Search */}
            <label>
              City:
              <div style={{ position: 'relative' }}>
                <input
                  name="city"
                  required
                  value={modalCityInput}
                  className="auth-input"
                  onChange={e => { setModalCityInput(e.target.value); if (e.target.value.length >= 2) searchCities(e.target.value, true); }}
                  style={{ width: '100%', padding: 6 }}
                />
                {modalCitySuggestions.length > 0 && (
                  <ul className="dropdown-list">
                    {modalCitySuggestions.map((city, i) => (
                      <li key={i} onClick={() => { setModalCityInput(city.id.toString()); setModalCitySuggestions([]); }}>
                        {city.name} (ID: {city.id})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>

            <button type="submit" className="auth-button" style={{ marginTop: '1rem', width: '100%' }}><Plus size={16} style={{ marginRight: 6 }} /> Confirm</button>
          </form>
        </Modal>
      )}

      {/* Delete Organizer Modal */}
      <DeleteModal
        showDeleteModal={showDeleteModal}
        organizerName={selectedOrganizer ? `${selectedOrganizer.firstName} ${selectedOrganizer.lastName}` : ''}
        onConfirm={confirmRemove}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedOrganizer(null);
        }}
      />
    </div>
  );
}