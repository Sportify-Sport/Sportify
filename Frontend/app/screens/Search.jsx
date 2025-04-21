import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useNavigation, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useFilters } from "../context/FilterContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import getApiBaseUrl from "../config/apiConfig";
const apiUrl = getApiBaseUrl();

export default function SearchScreen() {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showMainList, setShowMainList] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sportsMap, setSportsMap] = useState({});
  const [citiesMap, setCitiesMap] = useState({});
  const router = useRouter();
  const navigation = useNavigation();
  const { type } = useLocalSearchParams();
  const { filters, setFilters } = useFilters(); // Added setFilters to update the context
  const searchInputRef = useRef(null);

  const limit = 10;
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Load sports map from storage
  useEffect(() => {
    const loadSportsMap = async () => {
      try {
        const storedSports = await AsyncStorage.getItem('sportsMap');
        if (storedSports) setSportsMap(JSON.parse(storedSports));
      } catch (error) {
        console.error("Error loading sports map:", error);
      }
    };

    loadSportsMap();
  }, []);

  // Function to get city name by ID
  const getCityNameById = async (cityId) => {
    if (!cityId) return null;
    
    if (citiesMap[cityId]) {
      return citiesMap[cityId];
    }

    try {
      const response = await fetch(
        `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${cityId}}`
      );
      const data = await response.json();
      
      if (data.success && data.result && data.result.records) {
        const record = data.result.records.find(r => r._id.toString() === cityId.toString());
        if (record && (record.city_name_en || record.שם_ישוב)) {
          const cityName = record.city_name_en || record.שם_ישוב;
          setCitiesMap(prev => ({ ...prev, [cityId]: cityName }));
          return cityName;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching city from gov API:', error);
      return null;
    }
  };

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const fetchItemsFromApi = async (itemType, searchQuery, currentPage, pageSize, filters) => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Build the query string with mandatory parameters
      let query = `?type=${itemType}&page=${currentPage}&pageSize=${pageSize}`;

      // Add search query if provided
      if (searchQuery && searchQuery.trim().length > 0) {
        query += `&name=${encodeURIComponent(searchQuery.trim())}`;
      }

      // Add optional parameters only if they have real values
      if (filters) {
        if (filters.sport != null) query += `&sportId=${filters.sport}`;
        if (filters.city != null) query += `&cityId=${filters.city}`;
        
        // Handle age filter conversion
        if (filters.age != null) {
          if (filters.age === '13-18') {
            query += '&minAge=13&maxAge=18';
          } else if (filters.age === '18-30') {
            query += '&minAge=18&maxAge=30';
          } else if (filters.age === '30+') {
            query += '&minAge=30';
          }
        }
        
        if (filters.gender != null) query += `&gender=${filters.gender}`;
        if (itemType === "event") {
          if (filters.startDate != null) {
            query += `&startDate=${encodeURIComponent(filters.startDate)}`;
          }
          if (filters.endDate != null) {
            query += `&endDate=${encodeURIComponent(filters.endDate)}`;
          }
        }
      }

      const endpoint = `${apiUrl}/api/Search${query}`;
      // console.log("Fetching from API:", endpoint);

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${itemType}s: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(`API returned success: false for ${itemType}s`);
      }

      const items = await Promise.all(
        result.data.map(async (item) => {
          const cityName = await getCityNameById(item.cityId);
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

      return {
        items,
        hasMore: result.pagination?.hasMore ?? false,
      };
    } catch (error) {
      console.error(`Error fetching ${itemType}s:`, error);
      return { items: [], hasMore: false };
    }
  };

  // Function to check if any filters are applied
  const areFiltersApplied = () => {
    const filterValues = { ...filters };
    delete filterValues.resetSearch;
    return Object.values(filterValues).some(value => value != null);
  };

  // Fetch data only when search or filters are applied
  useEffect(() => {
    const fetchOnFilterApply = async () => {
      // Handle reset
      if (filters.resetSearch) {
        // Avoid redundant state updates
        if (filteredItems.length > 0 || suggestions.length > 0 || showMainList || page !== 1 || !hasMore || search !== "") {
          setFilteredItems([]);
          setShowMainList(false);
          setPage(1);
          setHasMore(true);
          setSuggestions([]);
          setSearch("");
        }
        // Reset the resetSearch flag to prevent loop
        setFilters(prev => ({ ...prev, resetSearch: false }));
        return;
      }

      // Do not fetch if no search query and no filters are applied
      if (search.length < 2 && !areFiltersApplied()) {
        if (filteredItems.length > 0 || suggestions.length > 0 || showMainList || page !== 1 || !hasMore) {
          setFilteredItems([]);
          setShowMainList(false);
          setPage(1);
          setHasMore(true);
          setSuggestions([]);
        }
        return;
      }

      // Fetch only if there's a search query or filters are applied
      try {
        const itemType = type || "event";
        const results = await fetchItemsFromApi(itemType, search, 1, limit, filters);
        setFilteredItems(results.items);
        setShowMainList(true);
        setPage(2);
        setHasMore(results.hasMore);
      } catch (error) {
        console.error("Error fetching items on filter apply:", error);
      }
    };

    fetchOnFilterApply();
  }, [filters, type, search, setFilters]); // Added setFilters as a dependency

  // Re-fetch data when the screen comes into focus, but only if necessary
  useFocusEffect(
    useCallback(() => {
      // If there are already items and no reset, show the existing list
      if (filteredItems.length > 0 && !filters.resetSearch) {
        setShowMainList(true);
        return;
      }

      const fetchOnFocus = async () => {
        // Handle reset
        if (filters.resetSearch) {
          if (filteredItems.length > 0 || suggestions.length > 0 || showMainList || page !== 1 || !hasMore || search !== "") {
            setFilteredItems([]);
            setShowMainList(false);
            setPage(1);
            setHasMore(true);
            setSuggestions([]);
            setSearch("");
          }
          // Reset the resetSearch flag to prevent loop
          setFilters(prev => ({ ...prev, resetSearch: false }));
          return;
        }

        // Do not fetch if no search query and no filters are applied
        if (search.length < 2 && !areFiltersApplied()) {
          if (filteredItems.length > 0 || suggestions.length > 0 || showMainList || page !== 1 || !hasMore) {
            setFilteredItems([]);
            setShowMainList(false);
            setPage(1);
            setHasMore(true);
            setSuggestions([]);
          }
          return;
        }

        // Fetch only if there's a search query or filters are applied
        try {
          const itemType = type || "event";
          const results = await fetchItemsFromApi(itemType, search, 1, limit, filters);
          setFilteredItems(results.items);
          setShowMainList(true);
          setPage(2);
          setHasMore(results.hasMore);
        } catch (error) {
          console.error("Error fetching items on screen focus:", error);
        }
      };

      fetchOnFocus();
    }, [search, filters, type, filteredItems, setFilters]) // Added setFilters as a dependency
  );

  // Debounced search handler
  const handleSearch = useCallback(async () => {
    // Handle reset
    if (filters.resetSearch) {
      if (suggestions.length > 0 || showMainList || filteredItems.length > 0 || page !== 1 || !hasMore) {
        setSuggestions([]);
        setShowMainList(false);
        setFilteredItems([]);
        setPage(1);
        setHasMore(true);
      }
      // Reset the resetSearch flag to prevent loop
      setFilters(prev => ({ ...prev, resetSearch: false }));
      return;
    }

    // Do not fetch if search length is less than 2
    if (search.length < 2) {
      if (suggestions.length > 0 || showMainList || filteredItems.length > 0 || page !== 1 || !hasMore) {
        setSuggestions([]);
        setShowMainList(false);
        setFilteredItems([]);
        setPage(1);
        setHasMore(true);
      }
      return;
    }

    try {
      const itemType = type || "event";
      const results = await fetchItemsFromApi(itemType, search, 1, limit, filters);
      setSuggestions(results.items);
      setShowMainList(true);
      setFilteredItems(results.items);
      setPage(2);
      setHasMore(results.hasMore);
    } catch (error) {
      console.error("Error searching items:", error);
    }
  }, [search, type, filters, setFilters]); // Added setFilters as a dependency

  // Load more items (infinite scroll)
  const loadItems = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const itemType = type || "event";
      const response = await fetchItemsFromApi(itemType, search, page, limit, filters);

      setFilteredItems((prev) => {
        const newItems = [...prev, ...response.items];
        const uniqueItems = Array.from(
          new Map(newItems.map((item) => [`${item.id}${item.type}`, item])).values()
        );
        return uniqueItems;
      });

      setPage(page + 1);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error("Error fetching more items:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, type, filters, search]);

  // Handle text input changes with debounce
  const handleTextChange = (text) => {
    setSearch(text);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (text.length >= 2) {
      setSearchTimeout(
        setTimeout(() => {
          handleSearch();
        }, 300)
      );
    } else {
      if (suggestions.length > 0 || showMainList || filteredItems.length > 0 || page !== 1 || !hasMore) {
        setSuggestions([]);
        setShowMainList(false);
        setFilteredItems([]);
        setPage(1);
        setHasMore(true);
      }
    }
  };

  const handleItemPress = (item) => {
    router.push({
      pathname: item.type === "event" ? "/screens/EventDetails" : "/screens/GroupDetails",
      params: item.type === "event" ? { eventId: item.id } : { groupId: item.id },
    });
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/tabs/explore');
    }
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center bg-green-100 p-3 mt-2 rounded-xl"
      onPress={() => handleItemPress(item)}
    >
      <Image source={{ uri: item.image }} className="w-10 h-10 rounded-full" />
      <View className="ml-3 flex-1">
        <Text className="text-base font-bold text-gray-900">{item.title || item.name}</Text>
        {item.date ? <Text className="text-sm text-gray-500">{item.date}</Text> : null}
        <Text className="text-sm text-gray-700">{item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center bg-white p-3 border-b border-gray-200"
      onPress={() => handleItemPress(item)}
    >
      <Text className="text-base text-gray-900">{item.title || item.name}</Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View className="flex-1 bg-gray-100 p-4">
        {/* Search header with cancel button */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1 flex-row items-center bg-white p-3 rounded-full shadow-sm">
            <Ionicons
              name="search"
              size={20}
              color="gray"
              className="ml-2"
              onPress={handleSearch}
            />
            <TextInput
              ref={searchInputRef}
              className="flex-1 ml-2 text-base text-gray-900 text-left"
              placeholder={`Search for ${type === "group" ? "a group" : "an event"}...`}
              placeholderTextColor="#6B7280"
              value={search}
              onChangeText={handleTextChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus={true}
              textAlign="left"
              textAlignVertical="center"
              editable={true}
              {...(Platform.OS === "web" ? { autoComplete: "off" } : {})}
              style={Platform.OS === "web" ? { outline: "none" } : {}}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color="gray" className="mr-2" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/screens/SearchFilter",
                  params: { type: type || "event" },
                })
              }
              className="p-1"
            >
              <Ionicons
                name="options-outline"
                size={24}
                color={Object.keys(filters).some((key) => filters[key] != null && key !== "resetSearch") ? "#10B981" : "gray"}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleCancel} className="ml-2">
            <Text className="text-base text-green-500 font-medium">Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Original bubble graphics styling */}
        <View className="relative h-32 w-full mb-4">
          <View className="absolute h-24 w-24 rounded-full bg-green-300 left-1/3 top-6" />
          <View className="absolute h-24 w-24 rounded-full bg-green-300 left-14 top " />
          <View className="absolute h-24 w-28 rounded-full bg-green-300 left-5 top-6" />
          <View className="absolute h-28 w-40 rounded-full bg-green-300 top-2 left-12 flex items-center justify-center">
            <Text className="text-lg font-bold text-green-900 text-center px-4">
              Find Your Favorite Event{"\n"}OR Group
            </Text>
          </View>
          <View className="absolute h-10 w-10 rounded-full bg-green-400 right-16 top-10 shadow-lg" />
          <View className="absolute h-6 w-6 rounded-full bg-green-400 right-4 top-4 shadow-lg" />
        </View>

        {/* Suggestions List */}
        {suggestions.length > 0 && !showMainList && (
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.id}${item.type}${index}`}
            renderItem={renderSuggestion}
            className="bg-white mt-2 rounded-lg shadow-sm max-h-40"
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Main List */}
        {showMainList && (
          <FlatList
            data={filteredItems}
            keyExtractor={(item, index) => `${item.id}${item.type}${page}${index}`}
            renderItem={renderItem}
            onEndReached={() => loadItems()}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            className="mt-4"
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}