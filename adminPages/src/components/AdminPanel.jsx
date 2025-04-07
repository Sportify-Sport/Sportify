import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMicrophone } from 'react-icons/fa';
// import SporifyLogo from '../assets/Images/Sportify logo.png';
const themeColor = '#65DA84';
const itemsPerPage = 6;

// Dummy data
const dummyEvents = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  image: `https://via.placeholder.com/40?text=E${i + 1}`,
  name: `Event ${i + 1}`,
  requiresTeams: i % 2 === 0 ? 'Yes' : 'No',
  location: ['New York', 'London', 'Tokyo'][i % 3],
  startDate: `2025-0${(i % 9) + 1}-0${(i % 27) + 1}`,
  endDate: `2025-0${(i % 9) + 1}-1${(i % 27) + 1}`,
  total: Math.floor(Math.random() * 100),
  minAge: 18 + (i % 10),
  gender: ['Any', 'Male', 'Female'][i % 3],
  isPublic: i % 2 === 0 ? 'Yes' : 'No',
}));

const dummyGroups = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  image: `https://via.placeholder.com/40?text=G${i + 1}`,
  name: `Group ${i + 1}`,
  description: `This is a description for group ${i + 1}`,
  sport: ['Football', 'Basketball', 'Tennis'][i % 3],
  city: ['Paris', 'Berlin', 'Madrid'][i % 3],
  totalMembers: Math.floor(Math.random() * 50),
  minAge: 16 + (i % 10),
  gender: ['Any', 'Male', 'Female'][i % 3],
  adminId: `A${1000 + i}`,
}));

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: themeColor,
    color: '#fff',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 0,
  },
  headerLeft: { fontSize: '1.1rem' },
  headerCenter: { fontSize: '1.3rem', fontWeight: 'bold' },
  headerRight: {},
  tabs: { display: 'flex', justifyContent: 'center', margin: '10px 0' },
  tabButton: isActive => ({
    backgroundColor: isActive ? themeColor : '#fff',
    color: isActive ? '#fff' : themeColor,
    border: `2px solid ${themeColor}`,
    padding: '8px 16px',
    margin: '0 4px',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '0.9rem',
  }),
  searchAddContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    marginBottom: '10px',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${themeColor}`,
    borderRadius: '4px',
    padding: '4px 8px',
    width: '400px',
  },
  searchInput: { border: 'none', outline: 'none', marginLeft: '8px', flex: 1 },
  addButton: {
    backgroundColor: themeColor,
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    width: '250px',
  },
  tableContainer: { flex: 1, padding: '0 20px' },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th: {
    border: '1px solid #ddd',
    padding: '12px',
    backgroundColor: themeColor,
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '0.9rem',
  },
  td: {
    border: '1px solid #ddd',
    backgroundColor: '#F3F3F3',
    padding: '12px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '0.9rem',
  },
  imageColumn: { width: '60px' },
  actionsColumn: { width: '110px' },
  pagination: { display: 'flex', justifyContent: 'center', padding: '10px 0' },
  pageButton: {
    margin: '0 4px',
    padding: '4px 8px',
    cursor: 'pointer',
    border: `1px solid ${themeColor}`,
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: themeColor,
    fontSize: '0.8rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: { backgroundColor: '#fff', padding: '20px', borderRadius: '6px', width: '400px', maxHeight: '80vh', overflowY: 'auto' },
  formGroup: { marginBottom: '10px' },
  formLabel: { display: 'block', marginBottom: '4px', fontSize: '0.9rem' },
  formInput: { width: '100%', padding: '6px', border: `1px solid ${themeColor}`, borderRadius: '4px', fontSize: '0.9rem' },
  formActions: { display: 'flex', justifyContent: 'flex-end', marginTop: '10px' },
};

export default function AdminPanel({ userName = 'User' }) {
  const [tab, setTab] = useState('events');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [events, setEvents] = useState(dummyEvents);
  const [groups, setGroups] = useState(dummyGroups);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const data = tab === 'events' ? events : groups;
  const filtered = data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, searchTerm]);

  const openModal = item => {
    setEditingItem(item || null);
    setFormData(item || {});
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleDelete = id => {
    if (window.confirm('Are you sure you want to delete this?')) {
      if (tab === 'events') setEvents(prev => prev.filter(e => e.id !== id));
      else setGroups(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token'); // Remove token from localStorage
      navigate('/login');               // Redirect to login page
      console.log('Logged out');
    }
  };
  
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }
    if (recognitionRef.current) recognitionRef.current.stop();
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = event => setSearchTerm(event.results[0][0].transcript);
    recognition.onerror = e => console.error('Speech recognition error', e.error);
    recognition.start();
  };

  const handleFormSubmit = e => {
    e.preventDefault();
    alert(`${editingItem ? 'Updated' : 'Created'} ${tab.slice(0, -1)}: ` + JSON.stringify(formData));
    closeModal();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>Welcome, {userName}!</div>
        <div style={styles.headerCenter}>Sportify</div>
        <div style={styles.headerRight}>
          <button onClick={handleLogout} style={styles.addButton}>Logout</button>
        </div>
      </header>

      <div style={styles.tabs}>
        {['events', 'groups'].map(key => (
          <button
            key={key}
            style={styles.tabButton(tab === key)}
            onClick={() => { setTab(key); setSearchTerm(''); }}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.searchAddContainer}>
        <div style={styles.searchBar}>
          <FaMicrophone onClick={startListening} style={{ cursor: 'pointer', color: themeColor, fontSize: '1.2rem' }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <button style={styles.addButton} onClick={() => openModal()}>
          {tab === 'events' ? 'Add Event' : 'Add Group'}
        </button>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              {(tab === 'events'
                ? ['Image','Name','Teams?','Location','Start Date','End Date','Total','Min Age','Gender','Public','Actions']
                : ['Image','Name','Description','Sport','City','Members','Min Age','Gender','Admin ID','Actions']
              ).map(h => (
                <th
                  key={h}
                  style={{
                    ...styles.th,
                    ...(h === 'Image' ? styles.imageColumn : {}),
                    ...(h === 'Actions' ? styles.actionsColumn : {}),
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map(item => (
              <tr key={item.id}>
                <td style={{ ...styles.td, ...styles.imageColumn }}>
                  <img src={item.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                </td>
                {(tab === 'events'
                  ? [item.name,item.requiresTeams,item.location,item.startDate,item.endDate,item.total,item.minAge,item.gender,item.isPublic]
                  : [item.name,item.description,item.sport,item.city,item.totalMembers,item.minAge,item.gender,item.adminId]
                ).map((v, i) => <td key={i} style={styles.td}>{v}</td>)}
                <td style={{ ...styles.td, ...styles.actionsColumn }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button style={{ ...styles.pageButton, padding: '6px 10px', flex: 1, marginRight: '4px' }} onClick={() => openModal(item)}>Edit</button>
                    <button style={{ ...styles.pageButton, padding: '6px 10px', backgroundColor: '#ccc', color: '#000', flex: 1 }} onClick={() => handleDelete(item.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button style={styles.pageButton} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
        <span style={{ margin: '0 8px', fontSize: '0.9rem' }}>{currentPage} / {totalPages}</span>
        <button style={styles.pageButton} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
      </div>

      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>{editingItem ? 'Edit' : 'Add'} {tab.slice(0, -1)}</h3>
            <form onSubmit={handleFormSubmit}>
              {(tab === 'events'
                ? [
                    { key: 'name', label: 'Name' },
                    { key: 'requiresTeams', label: 'Requires Teams' },
                    { key: 'location', label: 'Location' },
                    { key: 'startDate', label: 'Start Date', type: 'date' },
                    { key: 'endDate', label: 'End Date', type: 'date' },
                    { key: 'total', label: 'Total' },
                    { key: 'minAge', label: 'Min Age' },
                    { key: 'gender', label: 'Gender' },
                    { key: 'isPublic', label: 'Is Public' }
                  ]
                : [
                    { key: 'name', label: 'Name' },
                    { key: 'description', label: 'Description' },
                    { key: 'sport', label: 'Sport' },
                    { key: 'city', label: 'City' },
                    { key: 'totalMembers', label: 'Total Members' },
                    { key: 'minAge', label: 'Min Age' },
                    { key: 'gender', label: 'Gender' },
                    { key: 'adminId', label: 'Admin ID' }
                  ]
              ).map(field => (
                <div key={field.key} style={styles.formGroup}>
                  <label style={styles.formLabel}>{field.label}</label>
                  <input type={field.type || 'text'} value={formData[field.key] || ''} onChange={e => setFormData(d => ({ ...d, [field.key]: e.target.value }))} style={styles.formInput} required />
                </div>
              ))}

              <div style={styles.formActions}>
                <button type="button" onClick={closeModal} style={{ marginRight: '10px' }}>Cancel</button>
                <button type="submit" style={styles.addButton}>{editingItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
