import { useState, useEffect, useRef } from 'react';
import getApiBaseUrl from '../config/apiConfig';
import getCityNameById from '../services/locationService';

const useAdminSearch = (cityId, cityName, adminSearchTerm, citiesMap, setCitiesMap) => {
  const [adminResults, setAdminResults] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!adminSearchTerm.trim() || adminSearchTerm.trim().length < 1) {
      setAdminResults([]);
      setAdminLoading(false);
      setSelectedAdmin(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

     const fetchAdmins = async () => {
    try {
      setAdminLoading(true);
      const token = localStorage.getItem('adminAccessToken');
      const response = await fetch(
        `${getApiBaseUrl()}/api/AdminUsers/search?emailOrId=${encodeURIComponent(adminSearchTerm)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data = await response.json();
      
      const transformedData = await Promise.all(
        data.map(async (admin) => {
          const adminCityName = await getCityNameById(
            admin.cityId, 
            citiesMap, 
            setCitiesMap
          );
          
          return {
            ...admin,
            cityName: admin.cityId === parseInt(cityId) ? cityName : adminCityName,
          };
        })
      );
      
      setAdminResults(transformedData);
      setAdminError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching admins:', err);
        setAdminError('Failed to load admins');
        setAdminResults([]);
      }
    } finally {
      setAdminLoading(false);
    }
  };

    const timeoutId = setTimeout(fetchAdmins, 500);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [adminSearchTerm, cityId, cityName]);

  const handleSelectAdmin = (admin) => {
    if (selectedAdmin?.userId === admin.userId) {
      setSelectedAdmin(null);
    } else {
      setSelectedAdmin(admin);
    }
    setAdminError(null);
  };

  return {
    adminResults,
    adminLoading,
    adminError,
    setAdminError,
    selectedAdmin,
    setSelectedAdmin,
    handleSelectAdmin,
  };
};

export default useAdminSearch;