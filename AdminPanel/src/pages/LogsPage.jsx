import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import getApiBaseUrl from '../config/apiConfig';
import ThemeToggle from '../components/ThemeToggle';
import getCityNameById from '../services/locationService';
import { AUTH_ROUTES } from '../constants/authConstants';
import '../styles/globalPagesStyles/createItem.css';

const LogsPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { selectedCity } = useAuth();
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [citiesMap, setCitiesMap] = useState({});
  const abortControllerRef = useRef(null);
  const containerRef = useRef(null);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = String(hours % 12 || 12).padStart(2, '0');
    return `${year}-${month}-${day} at ${formattedHours}:${minutes} ${ampm}`;
  };

  const fetchCityName = async (cityId) => {
    return await getCityNameById(cityId, citiesMap, setCitiesMap);
  };

  const formatMessage = async (message) => {
    let formattedMessage = message;
    const cityIdMatch = message.match(/city (\d+)/);
    if (cityIdMatch) {
      const cityId = cityIdMatch[1];
      const cityName = await fetchCityName(cityId);
      formattedMessage = message.replace(`city ${cityId}`, `city ${cityName}`);
    }

    const timestampMatch = formattedMessage.match(/"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)"/);
    if (timestampMatch) {
      const timestamp = timestampMatch[1];
      formattedMessage = formattedMessage.replace(`"${timestamp}"`, `"${formatTimestamp(timestamp)}"`);
    }

    return formattedMessage;
  };

  const fetchLogs = async (page) => {
    if (!hasMore || loading) return;
    setLoading(true);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem('adminAccessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch(
        `${getApiBaseUrl()}/api/Logs/${type}/${id}?page=${page}&pageSize=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortControllerRef.current.signal,
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data = await response.json();
      if (data.success) {
        const formattedLogs = await Promise.all(
          data.logs.map(async (log) => ({
            ...log,
            message: await formatMessage(log.message),
          }))
        );
        setLogs((prev) => [...prev, ...formattedLogs]);
        setHasMore(data.pagination.hasMore);
        setCurrentPage(data.pagination.currentPage);
        console.log(`Fetched page ${page}, hasMore: ${data.pagination.hasMore}, logs:`, formattedLogs);
      } else {
        setError('Failed to fetch logs');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Error fetching logs');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage]);

  const handleScroll = () => {
    const container = containerRef.current || document.documentElement;
    const scrollTop = container === document.documentElement ? window.scrollY : container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container === document.documentElement ? window.innerHeight : container.clientHeight;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    console.log('Scroll event:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      isNearBottom,
      hasMore,
      loading,
    });

    if (isNearBottom && hasMore && !loading) {
      setCurrentPage((prev) => {
        const newPage = prev + 1;
        console.log('Incrementing to page:', newPage);
        return newPage;
      });
    }
  };

  useEffect(() => {
    const scrollContainer = containerRef.current || window;
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading]);

  const handleBackClick = () => {
    const cityId = selectedCity?.cityId;
    if (!cityId) {
      console.error('No city selected');
      navigate(AUTH_ROUTES.DASHBOARD);
      return;
    }
    if (type === 'city') {
      navigate(AUTH_ROUTES.DASHBOARD);
    } else if (type === 'event') {
      navigate(AUTH_ROUTES.EVENT_SELECTION.replace(':cityId', cityId));
    } else if (type === 'group') {
      navigate(AUTH_ROUTES.GROUP_SELECTION.replace(':cityId', cityId));
    }
  };

  return (
    <>
      <style>
        {`
          .create-container {
            overflow-y: auto;
            max-height: 100vh;
            scrollbar-width: none; /* Firefox */
          }
          .create-container::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Edge */
          }
        `}
      </style>
      <div className="create-container" ref={containerRef}>
        <div className="create-header">
          <button className="back-button" onClick={handleBackClick}>
            ← Back
          </button>
          <h1>{type.charAt(0).toUpperCase() + type.slice(1)} Logs</h1>
          <ThemeToggle />
        </div>
        <div className="group-card">
          {error && <span className="error-text">{error}</span>}
          <div className="group-info-grid">
            {logs.map((log, i) => (
              <div className="group-info-item" key={`${log.timestamp}-${i}`}>
                <strong>{formatTimestamp(log.timestamp)}</strong>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
          {loading && <div className="loading-spinner" />}
          {!hasMore && logs.length > 0 && (
            <p className="group-description">No more logs to load</p>
          )}
          {logs.length === 0 && !loading && (
            <p className="group-description">No logs available</p>
          )}
        </div>
      </div>
    </>
  );
};

export default LogsPage;