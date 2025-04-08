
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import getApiBaseUrl from "../config/apiConfig";
import axios from 'axios';

const apiUrl = getApiBaseUrl();

export default function ExploreScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [events, setEvents] = useState([]);
  const [type, setType] = useState("event");
  const [loading, setLoading] = useState(false);
  const [hasMoreGroups, setHasMoreGroups] = useState(true);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [lastGroupId, setLastGroupId] = useState(null);
  const [lastEventId, setLastEventId] = useState(null);
  const [lastEventDate, setLastEventDate] = useState(null);
  const [sportsMap, setSportsMap] = useState({});
  const [citiesMap, setCitiesMap] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login status

  const pageSize = 10;

  // Load sports map and check login status
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Check if user is logged in
        const token = await AsyncStorage.getItem('token');
        console.log('loadInitialData: Token from AsyncStorage:', token);
        setIsLoggedIn(!!token);

        // Load sports map
        const storedSports = await AsyncStorage.getItem('sportsMap');
        if (storedSports) {
          const parsedSportsMap = JSON.parse(storedSports);
          console.log('loadInitialData: Sports map loaded:', parsedSportsMap);
          setSportsMap(parsedSportsMap);
        } else {
          console.warn('loadInitialData: No sports map found in AsyncStorage');
        }
      } catch (error) {
        console.error("loadInitialData: Error loading initial data:", error);
      }
    };

    loadInitialData();
  }, []);

  // Simulate getCityNameById (since the API isn't working reliably)
  const getCityNameById = async (cityId) => {
    // Keep the original API call as requested (even though it doesn't work)
    try {
      const response = await fetch(
        `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${cityId}}`
      );
      const data = await response.json();

      if (data.success && data.result && data.result.records) {
        const record = data.result.records.find(r => r._id.toString() === cityId.toString());
        if (record && record['city_name_en']) {
          const fetchedCityName = record['city_name_en'];
          setCitiesMap(prev => ({ ...prev, [cityId]: fetchedCityName }));
          return fetchedCityName;
        }
      }
      return null;
    } catch (error) {
      console.error('getCityNameById: Error fetching city from gov API:', error);
      return null;
    }
  };

  const getSportIcon = (sportId) => {
    switch (sportId) {
      case 1: // Football
        return "football-outline";
      case 2: // Basketball
        return "basketball-outline";
      case 3: // Marathon/Running
        return "accessibility-outline";
      default:
        return "fitness-outline";
    }
  };

  // Fetch groups
  const loadGroups = async (reset = false) => {
    if (loading || (!hasMoreGroups && !reset)) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let query = `?pageSize=${pageSize}`;
      if (!reset && lastGroupId) {
        query += `&lastGroupId=${lastGroupId}`;
      }

      const response = await fetch(`${apiUrl}/api/Groups/GetGroups${query}`, { headers });
      if (!response.ok) {
        if (response.status === 401 && !token) {
          console.log('loadGroups: Unauthorized - redirecting to login');
          router.replace('/screens/Login');
          return;
        }
        throw new Error('Failed to fetch groups');
      }

      const result = await response.json();
      console.log('loadGroups: API response:', result);

      if (result.success && Array.isArray(result.data)) {
        const enhancedGroups = await Promise.all(
          result.data.map(async (group) => {
            const cityName = await getCityNameById(group.cityId);
            return { ...group, cityName };
          })
        );

        setGroups((prev) => reset ? enhancedGroups : [...prev, ...enhancedGroups]);

        if (enhancedGroups.length > 0) {
          const last = enhancedGroups[enhancedGroups.length - 1];
          setLastGroupId(last.groupId);
        }

        setHasMoreGroups(result.hasMore ?? false);
      }
    } catch (error) {
      console.error("loadGroups: Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch events
  const loadEvents = async (reset = false) => {
    if (loading || (!hasMoreEvents && !reset)) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let query = `?pageSize=${pageSize}`;
      if (!reset && lastEventId && lastEventDate) {
        query += `&lastEventId=${lastEventId}&lastEventDate=${encodeURIComponent(lastEventDate)}`;
      }

      const response = await fetch(`${apiUrl}/api/Events/GetEvents${query}`, { headers });
      if (!response.ok) {
        if (response.status === 401 && !token) {
          console.log('loadEvents: Unauthorized - redirecting to login');
          router.replace('/screens/Login');
          return;
        }
        throw new Error('Failed to fetch events');
      }

      const result = await response.json();
      console.log('loadEvents: API response:', result);

      if (result.success && Array.isArray(result.data)) {
        const enhancedEvents = await Promise.all(
          result.data.map(async (event) => {
            const cityName = await getCityNameById(event.cityId);
            return { ...event, cityName };
          })
        );

        setEvents((prev) => reset ? enhancedEvents : [...prev, ...enhancedEvents]);

        if (enhancedEvents.length > 0) {
          const last = enhancedEvents[enhancedEvents.length - 1];
          setLastEventId(last.eventId);
          setLastEventDate(last.startDatetime);
        }

        setHasMoreEvents(result.hasMore ?? false);
      }
    } catch (error) {
      console.error("loadEvents: Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (type === "group") {
      setGroups([]);
      setLastGroupId(null);
      setHasMoreGroups(true);
      loadGroups(true);
    } else if (type === "event") {
      setEvents([]);
      setLastEventId(null);
      setLastEventDate(null);
      setHasMoreEvents(true);
      loadEvents(true);
    }
  }, [type]);

  const renderGroup = ({ item }) => (
    <TouchableOpacity 
      className="flex-row items-center bg-green-100 p-4 my-2 rounded-lg shadow-sm"
      onPress={() => router.push({ pathname: "../screens/GroupDetails", params: { groupId: item.groupId } })}
    >
      <View className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-300 overflow-hidden">
        {item.groupImage ? (
          <Image
            source={{ uri: `${apiUrl}/Images/${item.groupImage}` }}
            className="w-full h-full"
            resizeMode="cover"
            onError={() => console.log("Image failed to load")}
          />
        ) : (
          <View className="flex-1 justify-center items-center bg-green-200">
            <Ionicons name="people" size={28} color="#065f46" />
          </View>
        )}
      </View>
      
      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
          {item.groupName}
        </Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="location-outline" size={16} color="#4b5563" />
          <Text className="text-sm text-gray-700 ml-1">
            {item.cityName || "Unknown location"}
          </Text>
        </View>
        <View className="flex-row items-center mt-1">
          <Ionicons name={getSportIcon(item.sportId)} size={16} color="#4b5563" />
          <Text className="text-sm text-gray-700 ml-1">
            {sportsMap[item.sportId] || `Sport ID: ${item.sportId}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEvent = ({ item }) => (
    <TouchableOpacity 
      className="flex-row items-center bg-green-100 p-4 my-2 rounded-lg shadow-sm"
      onPress={() => router.push({ pathname: "../screens/EventDetails", params: { eventId: item.eventId } })}
    >
      <View className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-300 overflow-hidden">
        {item.profileImage ? (
          <Image
            source={{ uri: `${apiUrl}/Images/${item.profileImage}` }}
            className="w-full h-full"
            resizeMode="cover"
            onError={() => console.log("Image failed to load")}
          />
        ) : (
          <View className="flex-1 justify-center items-center bg-green-200">
            <Ionicons name="calendar" size={28} color="#065f46" />
          </View>
        )}
      </View>
      
      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
          {item.eventName}
        </Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="location-outline" size={16} color="#4b5563" />
          <Text className="text-sm text-gray-700 ml-1">
            {item.cityName || "Unknown location"}
          </Text>
        </View>
        <View className="flex-row items-center mt-1">
          <Ionicons name={getSportIcon(item.sportId)} size={16} color="#4b5563" />
          <Text className="text-sm text-gray-700 ml-1">
            {sportsMap[item.sportId] || `Sport ID: ${item.sportId}`}
          </Text>
        </View>
        <View className="flex-row items-center mt-1">
          <Ionicons name="time-outline" size={16} color="#4b5563" />
          <Text className="text-sm text-gray-700 ml-1">
            {new Date(item.startDatetime).toLocaleDateString()} {new Date(item.startDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () =>
    loading ? (
      <View className="py-4">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    ) : null;

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <TouchableOpacity
        onPress={() => router.push({ pathname: "../screens/Search", params: { type } })}
        className="flex-row items-center bg-white p-3 rounded-full mb-4 shadow-sm"
      >
        <Ionicons name="search" size={20} color="gray" />
        <TextInput
          className="flex-1 ml-2 text-base text-gray-900"
          placeholder="Search for an event or group..."
          placeholderTextColor="#6B7280"
          editable={false}
        />
      </TouchableOpacity>

      <View className="flex-row justify-center mb-4">
        <TouchableOpacity
          className={`py-2 px-4 rounded-l-lg ${type === "event" ? "bg-green-500" : "bg-gray-300"}`}
          onPress={() => setType("event")}
        >
          <Text className={`text-lg font-bold ${type === "event" ? "text-white" : "text-gray-700"}`}>
            Events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`py-2 px-4 rounded-r-lg ${type === "group" ? "bg-green-500" : "bg-gray-300"}`}
          onPress={() => setType("group")}
        >
          <Text className={`text-lg font-bold ${type === "group" ? "text-white" : "text-gray-700"}`}>
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {type === "event" && (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.eventId)}
          renderItem={renderEvent}
          onEndReached={() => loadEvents()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            !loading && (
              <View className="mt-10 items-center">
                <Text className="text-gray-500">No events found.</Text>
              </View>
            )
          }
        />
      )}

      {type === "group" && (
        <FlatList
          data={groups}
          keyExtractor={(item) => String(item.groupId)}
          renderItem={renderGroup}
          onEndReached={() => loadGroups()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            !loading && (
              <View className="mt-10 items-center">
                <Text className="text-gray-500">No groups found.</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

