// src/pages/ManageSports.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import getApiBaseUrl from '../config/apiConfig';
import { Trash2, Edit2, Plus } from 'react-feather';
import Modal from '../components/Modal';
import '../styles/global.css';

export default function ManageSports() {
    const { currentUser, logout } = useAuth();
    const [sports, setSports] = useState([]);
    const [alert, setAlert] = useState(null);
    const [modal, setModal] = useState({ type: null, sport: null });
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
        if (!window.confirm(`Delete ${s.name}?`)) return;

        fetch(`${getApiBaseUrl()}/api/Sports/${s.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSports(sports.filter(x => x.id !== s.id));
                    showAlert(`Deleted ${s.name}`, 'success');
                } else {
                    showAlert(data.message || 'Failed to delete sport', 'error');
                }
            })
            .catch(() => showAlert('Error deleting sport', 'error'));
    };

    const handleAdd = (form) => {
        const formData = new FormData();
        if (form.imageFile) formData.append('sportImage', form.imageFile);

        // Add sportName as query param in URL
        const url = new URL(`${getApiBaseUrl()}/api/Sports/add`);
        url.searchParams.append('sportName', form.name);

        fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': '*/*'
                // DON'T set Content-Type here! Let browser set it automatically for multipart/form-data
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
                        <h1 className="dashboard-title">Manage Sports</h1>
                        <div className="dashboard-actions">
                            <ThemeToggle />
                            <button onClick={() => navigate('/select-city')} className="change-city-btn">
                                Return to Dashboard
                            </button>
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

                <div className="responsive-flex" style={{ gap: '1.5rem', flexWrap: 'wrap' }}>
                    {sports.map(s => (
                        <div
                            key={s.id}
                            className="city-card"
                            style={{
                                width: 240,
                                textAlign: 'center',
                                padding: '1rem',
                                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                                borderRadius: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <img
                                src={s.imgUrl}
                                alt={s.name}
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    marginBottom: 12
                                }}
                            />
                            <h3 style={{ margin: '0 0 8px' }}>{s.name}</h3>
                            <small>ID: {s.id}</small>
                            <div style={{ marginTop: 12 }}>
                                <Trash2
                                    size={22}
                                    style={{ cursor: 'pointer', marginRight: 16, transition: 'all 0.2s' }}
                                    onMouseOver={e => Object.assign(e.currentTarget.style, { color: 'red', transform: 'scale(1.3)' })}
                                    onMouseOut={e => Object.assign(e.currentTarget.style, { color: '', transform: '' })}
                                    onClick={() => handleDelete(s)}
                                />
                                <Edit2
                                    size={22}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setModal({ type: 'edit', sport: s })}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal for Add/Edit */}
            {modal.type && (
                <Modal onClose={() => setModal({ type: null, sport: null })}>
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
        </div>
    );
}
