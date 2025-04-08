// import React, { useState, useEffect, useCallback, useRef } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   ActivityIndicator,
//   Keyboard,
//   TouchableWithoutFeedback,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { useFilters } from "../context/FilterContext";
// import { fetchItems, searchItems } from "../context/mockData";

// export default function SearchScreen() {
//   const [search, setSearch] = useState("");
//   const [suggestions, setSuggestions] = useState([]);
//   const [filteredItems, setFilteredItems] = useState([]);
//   const [showMainList, setShowMainList] = useState(false);
//   const [page, setPage] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [hasMore, setHasMore] = useState(true);
//   const router = useRouter();
//   const { type } = useLocalSearchParams();
//   const { filters } = useFilters();
//   const searchInputRef = useRef(null);

//   const limit = 10;
//   const [searchTimeout, setSearchTimeout] = useState(null);

//   // Auto-focus on mount
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       searchInputRef.current?.focus();
//     }, 100);

//     return () => clearTimeout(timer);
//   }, []);

//   // Debounced search handler
//   const handleSearch = useCallback(async () => {
//     if (search.length < 2) {
//       setSuggestions([]);
//       setShowMainList(false);
//       setFilteredItems([]);
//       return;
//     }

//     try {
//       const itemType = type || "event";
//       const results = await searchItems(search, itemType, filters);
//       setSuggestions(results);
//       setShowMainList(true);
//       setFilteredItems(results);
//       setPage(1);
//       setHasMore(true);
//     } catch (error) {
//       console.error("Error searching items:", error);
//     }
//   }, [search, type, filters]);

//   // Load more items
//   const loadItems = useCallback(async (reset = false) => {
//     if (loading || !hasMore) return;
  
//     setLoading(true);
//     try {
//       const currentPage = reset ? 1 : page;
//       const itemType = type || "event";
//       const response = await fetchItems(itemType, currentPage, limit, filters, search);
      
//       setFilteredItems((prev) => {
//         const newItems = reset ? response.items : [...prev, ...response.items];
//         const uniqueItems = Array.from(
//           new Map(newItems.map((item) => [`${item.id}${item.type}`, item])).values()
//         );
//         return uniqueItems;
//       });
      
//       setPage(currentPage + 1);
//       setHasMore(response.hasMore);
//     } catch (error) {
//       console.error("Error fetching items:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [loading, hasMore, page, type, filters, search]);

//   // Handle text input changes with debounce
//   const handleTextChange = (text) => {
//     setSearch(text);
    
//     // Clear previous timeout
//     if (searchTimeout) {
//       clearTimeout(searchTimeout);
//     }
    
//     // Set new timeout
//     if (text.length >= 2) {
//       setSearchTimeout(
//         setTimeout(() => {
//           handleSearch();
//         }, 300) // 300ms delay
//       );
//     } else {
//       setSuggestions([]);
//       setShowMainList(false);
//       setFilteredItems([]);
//     }
//   };

//   const handleItemPress = (item) => {
//     router.push({
//       pathname: "/screens/ItemDetailsScreen",
//       params: { item: JSON.stringify(item) },
//     });
//     setSuggestions([]);
//     setShowMainList(false);
//     setSearch("");
//     Keyboard.dismiss();
//   };

//   const handleCancel = () => {
//     router.back();
//   };

//   // Clean up timeouts on unmount
//   useEffect(() => {
//     return () => {
//       if (searchTimeout) {
//         clearTimeout(searchTimeout);
//       }
//     };
//   }, [searchTimeout]);

//   const renderItem = ({ item }) => (
//     <TouchableOpacity
//       className="flex-row items-center bg-green-100 p-3 mt-2 rounded-xl"
//       onPress={() => handleItemPress(item)}
//     >
//       <Image source={{ uri: item.image }} className="w-10 h-10 rounded-full" />
//       <View className="ml-3 flex-1">
//         <Text className="text-base font-bold text-gray-900">{item.title || item.name}</Text>
//         {item.date ? <Text className="text-sm text-gray-500">{item.date}</Text> : null}
//         <Text className="text-sm text-gray-700">{item.location}</Text>
//       </View>
//     </TouchableOpacity>
//   );

//   const renderSuggestion = ({ item }) => (
//     <TouchableOpacity
//       className="flex-row items-center bg-white p-3 border-b border-gray-200"
//       onPress={() => handleItemPress(item)}
//     >
//       <Text className="text-base text-gray-900">{item.title || item.name}</Text>
//     </TouchableOpacity>
//   );

//   const renderFooter = () => {
//     if (!loading) return null;
//     return (
//       <View className="py-4">
//         <ActivityIndicator size="large" color="#10B981" />
//       </View>
//     );
//   };

//   const dismissKeyboard = () => {
//     Keyboard.dismiss();
//   };

//   return (
//     <TouchableWithoutFeedback onPress={dismissKeyboard}>
//       <View className="flex-1 bg-gray-100 p-4">
//         {/* Search header with cancel button */}
//         <View className="flex-row items-center justify-between mb-4">
//           <View className="flex-1 flex-row items-center bg-white p-3 rounded-full shadow-sm">
//             <Ionicons
//               name="search"
//               size={20}
//               color="gray"
//               className="ml-2"
//               onPress={handleSearch}
//             />
//             <TextInput
//               ref={searchInputRef}
//               className="flex-1 ml-2 text-base text-gray-900 text-left" // Force left alignment
//               placeholder={`Search for ${type === "group" ? "a group" : "an event"}...`}
//               placeholderTextColor="#6B7280"
//               value={search}
//               onChangeText={handleTextChange}
//               onSubmitEditing={handleSearch}
//               returnKeyType="search"
//               autoFocus={true}
//               textAlign="left" // Ensure text stays left-aligned
//               textAlignVertical="center"
//             />
//             {search.length > 0 && (
//               <TouchableOpacity onPress={() => setSearch("")}>
//                 <Ionicons name="close-circle" size={20} color="gray" className="mr-2" />
//               </TouchableOpacity>
//             )}
//             <TouchableOpacity
//               onPress={() =>
//                 router.push({
//                   pathname: "/screens/SearchFilter",
//                   params: { type: type || "event" },
//                 })
//               }
//               className="p-1"
//             >
//               <Ionicons
//                 name="options-outline"
//                 size={24}
//                 color={Object.keys(filters).some((key) => filters[key]) ? "#10B981" : "gray"}
//               />
//             </TouchableOpacity>
//           </View>
//           <TouchableOpacity onPress={handleCancel} className="ml-2">
//             <Text className="text-base text-green-500 font-medium">Cancel</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Original bubble graphics styling - moved below search bar */}
//         <View className="relative h-32 w-full mb-4">
//           <View className="absolute h-24 w-24 rounded-full bg-green-300 left-1/4 top-4" />
//           <View className="absolute h-24 w-24 rounded-full bg-green-300 left-12 top " />
//           <View className="absolute h-24 w-24 rounded-full bg-green-300 left- top-4" />
//           <View className="absolute h-28 w-40 rounded-full bg-green-300 top-2 left-6 flex items-center justify-center">
//             <Text className="text-lg font-bold text-green-900 text-center px-4">
//               Find Your Favorite Event{"\n"}OR Group
//             </Text>
//           </View>
//           <View className="absolute h-10 w-10 rounded-full bg-green-400 right-16 top-10 shadow-lg" />
//           <View className="absolute h-6 w-6 rounded-full bg-green-400 right-4 top-4 shadow-lg" />
//         </View>

//         {/* Suggestions List */}
//         {suggestions.length > 0 && !showMainList && (
//           <FlatList
//             data={suggestions}
//             keyExtractor={(item, index) => `${item.id}${item.type}${index}`}
//             renderItem={renderSuggestion}
//             className="bg-white mt-2 rounded-lg shadow-sm max-h-40"
//             keyboardShouldPersistTaps="handled"
//           />
//         )}

//         {/* Main List */}
//         {showMainList && (
//           <FlatList
//             data={filteredItems}
//             keyExtractor={(item, index) => `${item.id}${item.type}${page}${index}`}
//             renderItem={renderItem}
//             onEndReached={() => loadItems()}
//             onEndReachedThreshold={0.5}
//             ListFooterComponent={renderFooter}
//             className="mt-4"
//             keyboardShouldPersistTaps="handled"
//           />
//         )}
//       </View>
//     </TouchableWithoutFeedback>
//   );
// }

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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
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
  const [lastEventId, setLastEventId] = useState(null);
  const [lastEventDate, setLastEventDate] = useState(null);
  const [lastGroupId, setLastGroupId] = useState(null);
  const [sportsMap, setSportsMap] = useState({});
  const [citiesMap, setCitiesMap] = useState({});
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const { filters } = useFilters();
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
        `https://data.gov.il/api/3/action/datastore_search?resource_id=351d4347-8ee0-4906-8e5b-9533aef13595&filters={"_id":${cityId}}`
      );
      const data = await response.json();
      
      if (data.success && data.result && data.result.records) {
        const record = data.result.records.find(r => r._id.toString() === cityId.toString());
        if (record && record['תעתיק']) {
          const cityName = record['תעתיק'];
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

  // Fetch items (events or groups) from the API
  const fetchItemsFromApi = async (itemType, currentPage, pageSize, filters, reset = false) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/screens/Login');
        return { items: [], hasMore: false };
      }

      let query = `?pageSize=${pageSize}`;

      // Add filters to the query
      if (filters) {
        if (filters.cityId) query += `&cityId=${filters.cityId}`;
        if (filters.sportId) query += `&sportId=${filters.sportId}`;
        if (filters.gender) query += `&gender=${filters.gender}`;
        if (filters.minAge) query += `&minAge=${filters.minAge}`;
      }

      if (itemType === "event") {
        if (!reset && lastEventId && lastEventDate) {
          query += `&lastEventId=${lastEventId}&lastEventDate=${encodeURIComponent(lastEventDate)}`;
        }
      } else if (itemType === "group") {
        if (!reset && lastGroupId) {
          query += `&lastGroupId=${lastGroupId}`;
        }
      }

      const endpoint = itemType === "event" 
        ? `${apiUrl}/api/Events/GetEvents${query}`
        : `${apiUrl}/api/Groups/GetGroups${query}`;

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
            date: itemType === "event" ? new Date(item.startDate).toLocaleDateString() : null,
          };
        })
      );

      if (itemType === "event" && items.length > 0) {
        const last = items[items.length - 1];
        setLastEventId(last.eventId);
        setLastEventDate(last.startDate);
      } else if (itemType === "group" && items.length > 0) {
        const last = items[items.length - 1];
        setLastGroupId(last.groupId);
      }

      return {
        items,
        hasMore: result.hasMore ?? false,
      };
    } catch (error) {
      console.error(`Error fetching ${itemType}s:`, error);
      return { items: [], hasMore: false };
    }
  };

  // Filter items to only include those starting with the search string
  const filterItemsBySearch = (items, searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const lowerSearch = searchQuery.toLowerCase();
    return items.filter(item => 
      (item.title || item.name).toLowerCase().startsWith(lowerSearch)
    );
  };

  // Search items (for suggestions)
  const searchItemsFromApi = async (searchQuery, itemType, filters) => {
    const result = await fetchItemsFromApi(itemType, 1, limit, filters, true);
    const filtered = filterItemsBySearch(result.items, searchQuery);
    return filtered;
  };

  // Debounced search handler
  const handleSearch = useCallback(async () => {
    if (search.length < 2) {
      setSuggestions([]);
      setShowMainList(false);
      setFilteredItems([]);
      return;
    }

    try {
      const itemType = type || "event";
      const results = await searchItemsFromApi(search, itemType, filters);
      setSuggestions(results);
      setShowMainList(true);
      setFilteredItems(results);
      setPage(1);
      setHasMore(true);
      setLastEventId(null);
      setLastEventDate(null);
      setLastGroupId(null);
    } catch (error) {
      console.error("Error searching items:", error);
    }
  }, [search, type, filters]);

  // Load more items
  const loadItems = useCallback(async (reset = false) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const itemType = type || "event";
      const response = await fetchItemsFromApi(itemType, currentPage, limit, filters, reset);

      const filteredNewItems = filterItemsBySearch(response.items, search);

      setFilteredItems((prev) => {
        const newItems = reset ? filteredNewItems : [...prev, ...filteredNewItems];
        const uniqueItems = Array.from(
          new Map(newItems.map((item) => [`${item.id}${item.type}`, item])).values()
        );
        return uniqueItems;
      });

      setPage(currentPage + 1);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error("Error fetching items:", error);
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
      setSuggestions([]);
      setShowMainList(false);
      setFilteredItems([]);
    }
  };

  const handleItemPress = (item) => {
    router.push({
      pathname: item.type === "event" ? "/screens/EventDetails" : "/screens/GroupDetails",
      params: item.type === "event" ? { eventId: item.id } : { groupId: item.id },
    });
    setSuggestions([]);
    setShowMainList(false);
    setSearch("");
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    router.back();
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
                color={Object.keys(filters).some((key) => filters[key]) ? "#10B981" : "gray"}
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