import getApiBaseUrl from '../config/apiConfig';

export const fetchCityIdByName = async (cityName) => {
  if (!cityName) throw new Error('City name is required');

  const response = await fetch(
    `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&q=${encodeURIComponent(cityName)}`
  );
  const data = await response.json();

  if (data.success && data.result?.records?.length > 0) {
    const record = data.result.records.find(
      r => r.city_name_en?.toLowerCase() === cityName.toLowerCase()
    );
    if (record?._id) {
      return record._id;
    }
    throw new Error('City not found in government database');
  }
  throw new Error('No city data available');
};

export const searchGroups = async (cityId, searchQuery, abortSignal) => {
  if (!cityId) throw new Error('City ID is required');
  if (!searchQuery) return [];

  const token = localStorage.getItem('adminAccessToken');
  const normalizedQuery = searchQuery.toLowerCase();
  const url = `${getApiBaseUrl()}/api/AdminGroups/${cityId}?name=${encodeURIComponent(normalizedQuery)}&sortBy=name&page=1&pageSize=10`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    signal: abortSignal
  });

  if (!response.ok) throw new Error(`Search failed: ${response.status} ${response.statusText}`);
  
  const data = await response.json();
  return data.groups || [];
};

export const fetchGroupsByCity = async (cityId, sortBy, abortSignal) => {
  if (!cityId) throw new Error('City ID is required');

  const token = localStorage.getItem('adminAccessToken');
  const url = `${getApiBaseUrl()}/api/AdminGroups/${cityId}?sortBy=${sortBy}&page=1&pageSize=10`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    signal: abortSignal
  });

  if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  
  const data = await response.json();
  return data.groups || [];
};