import { useState, useEffect } from 'react';
import { fetchCityIdByName } from '../services/apiService';

const useCityId = (cityName) => {
  const [cityId, setCityId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCityId = async () => {
      if (!cityName) {
        setLoading(false);
        return;
      }

      try {
        const id = await fetchCityIdByName(cityName);
        setCityId(id);
        setError(null);
      } catch (error) {
        console.error("Error fetching city ID:", error);
        setError("Failed to identify city in government records");
      } finally {
        setLoading(false);
      }
    };

    getCityId();
  }, [cityName]);

  return { cityId, cityIdError: error, cityIdLoading: loading };
};

export default useCityId;