import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import getApiBaseUrl from '../config/apiConfig';
import Modal from '../components/Modal';
import DeleteModal from '../components/DeleteModal';
import '../styles/global.css';
import { Trash2, Edit2, Plus, ArrowLeft } from 'react-feather';

export default function ManageSports() {
    const { currentUser, logout } = useAuth();
    const [sports, setSports] = useState([]);
    const [alert, setAlert] = useState(null);
    const [modal, setModal] = useState({ type: null, sport: null });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedSport, setSelectedSport] = useState(null);
    const navigate = useNavigate();

    const token = localStorage.getItem('adminAccessToken');

    useEffect(() => {
        fetchSports();
    }, []);

    const showAlert = (msg, type = 'success') => {
        setAlert({ msg, type });
        setTimeout(() => setAlert(null), 5000);
    };

    const fetchSports = () => {
        if (!token) {
            showAlert('No authorization token found', 'error');
            return;
        }

        fetch(`${getApiBaseUrl()}/api/Sports`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP status ${res.status}`);
                return res.json();
            })
            .then(data => {
                const mappedSports = data.map(s => ({
                    id: s.sportId,
                    name: s.sportName,
                    imgUrl: `${getApiBaseUrl()}/Images/${s.sportImage}`,
                    imageFilename: s.sportImage,
                }));
                setSports(mappedSports);
            })
            .catch(() => showAlert('Failed to load sports', 'error'));
    };

    const handleDelete = (s) => {
        setSelectedSport(s);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!selectedSport) return;

        fetch(`${getApiBaseUrl()}/api/Sports/${selectedSport.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSports(sports.filter(x => x.id !== selectedSport.id));
                    showAlert(`Deleted ${selectedSport.name}`, 'success');
                } else {
                    showAlert(data.message || 'Failed to delete sport', 'error');
                }
            })
            .catch(() => showAlert('Error deleting sport', 'error'))
            .finally(() => {
                setShowDeleteModal(false);
                setSelectedSport(null);
            });
    };

    const handleAdd = (form) => {
        const formData = new FormData();
        if (form.imageFile) formData.append('sportImage', form.imageFile);

        const url = new URL(`${getApiBaseUrl()}/api/Sports/add`);
        url.searchParams.append('sportName', form.name);

        fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            },
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showAlert(`Added sport: ${form.name}`, 'success');
                    setModal({ type: null, sport: null });
                    fetchSports();
                } else {
                    showAlert(data.message || 'Failed to add sport', 'error');
                }
            })
            .catch(() => showAlert('Error adding sport', 'error'));
    };

    const handleUpdate = (form) => {
        const formData = new FormData();
        if (form.imageFile) formData.append('sportImage', form.imageFile);

        fetch(`${getApiBaseUrl()}/api/Sports/${form.id}/image`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            },
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showAlert(`Updated sport image: ${form.name}`, 'success');
                    setModal({ type: null, sport: null });
                    fetchSports();
                } else {
                    showAlert(data.message || 'Failed to update sport image', 'error');
                }
            })
            .catch(() => showAlert('Error updating sport image', 'error'));
    };

    const handleSave = (form) => {
        if (modal.type === 'edit') {
            handleUpdate(form);
        } else {
            handleAdd(form);
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
                            <h1 className="dashboard-title">Manage Sports</h1>
                        </div>
                        <div className="dashboard-actions">
                            <ThemeToggle />
                            <button onClick={logout} className="logout-btn">Log Out</button>
                        </div>
                    </div>
                </header>

                <p style={{ margin: '1rem 0' }}>
                    Welcome, <strong>{currentUser.name}</strong>
                </p>

                {alert && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, padding: '0.5rem',
                        background: alert.type === 'success' ? '#e6ffed' : '#ffe6e6',
                        color: alert.type === 'success' ? '#2e7d32' : '#c62828',
                        textAlign: 'center', zIndex: 100
                    }}>
                        {alert.msg}
                    </div>
                )}

                <button
                    className="auth-button"
                    style={{ marginBottom: '1rem' }}
                    onClick={() => setModal({ type: 'add', sport: null })}
                >
                    <Plus size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Add Sport
                </button>

                <div className="responsive-flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                    {sports.map(s => (
                        <div
                            key={s.id}
                            className="city-card"
                            style={{
                                padding: '1rem',
                                width: 270,
                                backgroundColor: 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 8,
                            }}
                        >
                            <img
                                src={s.imgUrl}
                                alt={s.name}
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    marginBottom: 8
                                }}
                            />
                            <div>
                                <strong>Name:</strong> {s.name}<br />
                                <strong>ID:</strong> {s.id}
                            </div>
                            <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
                                <Trash2
                                    size={22}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseOver={e => Object.assign(e.currentTarget.style, { color: 'red', transform: 'scale(1.3)' })}
                                    onMouseOut={e => Object.assign(e.currentTarget.style, { color: '', transform: '' })}
                                    onClick={() => handleDelete(s)}
                                />
                                <Edit2
                                    size={22}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseOver={e => Object.assign(e.currentTarget.style, { color: '#007bff', transform: 'scale(1.3)' })}
                                    onMouseOut={e => Object.assign(e.currentTarget.style, { color: '', transform: '' })}
                                    onClick={() => setModal({ type: 'edit', sport: s })}
                                />
                            </div>
                        </div>
                    ))}
                    {!sports.length && <div className="no-results-message">No sports found.</div>}
                </div>
            </div>

            {/* Modal for Add/Edit */}
            {modal.type && (
                <Modal isOpen={modal.type !== null} onClose={() => setModal({ type: null, sport: null })}>
                    <h2>{modal.type === 'edit' ? 'Edit Sport' : 'Add Sport'}</h2>
                    <form onSubmit={e => {
                        e.preventDefault();
                        const fd = new FormData(e.target);
                        const fileInput = e.target.elements.image;
                        const form = {
                            id: modal.sport?.id,
                            name: fd.get('name'),
                            imageFile: fileInput.files.length > 0 ? fileInput.files[0] : null
                        };
                        handleSave(form);
                    }}>
                        <label style={{ display: 'block', marginBottom: 12 }}>
                            Name:
                            <input
                                name="name"
                                defaultValue={modal.sport?.name}
                                required
                                disabled={modal.type === 'edit'}
                                pattern="^[A-Za-z\s]{1,35}$"
                                title="Only letters and spaces, max 35 characters"
                                maxLength={35}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    marginTop: 6,
                                    borderRadius: 6,
                                    border: modal.type === 'edit' ? '1.5px solid #ccc' : '1.5px solid #007bff',
                                    backgroundColor: modal.type === 'edit' ? '#f5f5f5' : 'white',
                                    color: modal.type === 'edit' ? '#555' : 'black',
                                    cursor: modal.type === 'edit' ? 'not-allowed' : 'text',
                                    fontSize: 16,
                                }}
                            />
                        </label>
                        <label style={{ display: 'block', marginBottom: 12 }}>
                            Image:
                            <input
                                name="image"
                                type="file"
                                accept="image/*"
                                style={{
                                    marginTop: 6,
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                    border: '1.5px solid #007bff',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    color: '#007bff',
                                }}
                            />
                        </label>
                        <button
                            type="submit"
                            className="auth-button"
                            style={{ marginTop: '1rem', width: '100%' }}
                        >
                            Confirm
                        </button>
                    </form>
                </Modal>
            )}

            {/* Delete Sport Modal */}
            <DeleteModal
                showDeleteModal={showDeleteModal}
                organizerName={selectedSport ? selectedSport.name : ''}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setSelectedSport(null);
                }}
            />
        </div>
    );
}