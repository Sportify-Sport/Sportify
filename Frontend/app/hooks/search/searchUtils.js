import AsyncStorage from '@react-native-async-storage/async-storage';
import getApiBaseUrl from "../../config/apiConfig";
import { getCityNameById } from "../../services/locationService";

const apiUrl = getApiBaseUrl();

export const fetchItemsFromApi = async (itemType, searchQuery, currentPage, pageSize, filters, abortControllerRef) => {
  console.log(`Starting fetch for ${itemType} - page ${currentPage}`);
  if (abortControllerRef.current) {
    abortControllerRef.current.abort(); // Cancel previous request
    console.log(`Aborted previous fetch for ${itemType}`);
  }
  abortControllerRef.current = new AbortController();

  try {
    const token = await AsyncStorage.getItem('token');
    let query = `?type=${itemType}&page=${currentPage}&pageSize=${pageSize}`;
    if (searchQuery && searchQuery.trim().length > 0) {
      query += `&name=${encodeURIComponent(searchQuery.trim())}`;
    }
    if (filters) {
      if (filters.sport != null) query += `&sportId=${filters.sport}`;
      if (filters.city != null) query += `&cityId=${filters.city}`;
      if (filters.age != null) {
        if (filters.age === '13-18') query += '&minAge=13&maxAge=18';
        else if (filters.age === '18-30') query += '&minAge=18&maxAge=30';
        else if (filters.age === '30+') query += '&minAge=30';
      }
      if (filters.gender != null) query += `&gender=${filters.gender}`;
      if (itemType === "event") {
        if (filters.startDate != null) query += `&startDate=${encodeURIComponent(filters.startDate)}`;
        if (filters.endDate != null) query += `&endDate=${encodeURIComponent(filters.endDate)}`;
      }
    }

    const endpoint = `${apiUrl}/api/Search${query}`;
    console.log(`Fetching from: ${endpoint}`);
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: abortControllerRef.current.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${itemType}s: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`API returned success: false for ${itemType}s`);
    }

    const items = await Promise.all(
      result.data.map(async (item) => {
        const cityName = await getCityNameById(item.cityId, null, null);
        return {
          ...item,
          id: itemType === "event" ? item.eventId : item.groupId,
          type: itemType,
          title: itemType === "event" ? item.eventName : item.groupName,
          image: itemType === "event" ? `${apiUrl}/Images/${item.eventImage || 'default_event.png'}` : `${apiUrl}/Images/${item.groupImage || 'default_group.png'}`,
          location: cityName || "Unknown location",
          date: itemType === "event" && item.startDate ? new Date(item.startDate).toLocaleDateString() : null,
        };
      })
    );

    console.log(`Fetched ${items.length} ${itemType}s for page ${currentPage}`);
    return {
      items,
      hasMore: result.pagination?.hasMore ?? false,
    };
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(`Error fetching ${itemType}s:`, error);
    }
    return { items: [], hasMore: false };
  } finally {
    if (abortControllerRef.current.signal.aborted) {
      console.log(`Fetch completed but was aborted for ${itemType}`);
    }
  }
};

export const areFiltersApplied = (filters) => {
  const filterValues = { ...filters };
  delete filterValues.resetSearch;
  return Object.values(filterValues).some(value => value != null);
};

export default {};