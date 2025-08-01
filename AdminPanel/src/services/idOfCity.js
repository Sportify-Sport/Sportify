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

export const fetchDataByCity = async (
  endpoint, // e.g., 'AdminEvents' or 'AdminGroups'
  responseKey, // e.g., 'events' or 'groups'
  cityId,  
  searchTerm = '',
  sortBy = 'name', 
  page = 1, 
  pageSize = 10,
  token,
  signal
) => {
  try {
    if (!cityId) throw new Error('City ID is required');
    const url = new URL(`${getApiBaseUrl()}/api/${endpoint}/${cityId}`);
    if (searchTerm) {
      url.searchParams.append('name', searchTerm);
    }
    url.searchParams.append('sortBy', sortBy);
    url.searchParams.append('page', page);
    url.searchParams.append('pageSize', pageSize);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
   return {
      [responseKey]: data[responseKey] || [],
      hasMore: data.hasMore || false,
      currentPage: page,
    };
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(`Error fetching ${responseKey}:`, error);
      throw error;
    }
    return {
      [responseKey]: [],
      hasMore: false,
      currentPage: page,
    };
  }
};