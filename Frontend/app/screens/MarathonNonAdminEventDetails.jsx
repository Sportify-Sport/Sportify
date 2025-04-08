import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import getApiBaseUrl from "../config/apiConfig";

const apiUrl = getApiBaseUrl();

export default function MarathonNonAdminEventDetails() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegisteredAsPlayer, setIsRegisteredAsPlayer] = useState(false);
  const [isRegisteredAsSpectator, setIsRegisteredAsSpectator] = useState(false);
  const [sportsMap, setSportsMap] = useState({});
  const [citiesMap, setCitiesMap] = useState({});

  // Load sports map from storage
  useEffect(() => {
    const loadSportsMap = async () => {
      try {
        const storedSports = await AsyncStorage.getItem('sportsMap');
        if (storedSports) {
          setSportsMap(JSON.parse(storedSports));
        }
      } catch (error) {
        console.error("Error loading sports map:", error);
      }
    };

    loadSportsMap();
  }, []);

  // Simulate getCityNameById
  const getCityNameById = async (cityId) => {
    if (!cityId) return null;

    if (citiesMap[cityId]) {
      return citiesMap[cityId];
    }

    const staticCitiesMap = {
      101: "Haifa",
      102: "Tel Aviv",
      103: "Jerusalem",
      104: "Eilat",
      105: "Nazareth",
      106: "Ramat Gan",
    };

    const cityName = staticCitiesMap[cityId] || null;
    if (cityName) {
      setCitiesMap(prev => ({ ...prev, [cityId]: cityName }));
      return cityName;
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

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/screens/Login');
          return;
        }

        const response = await fetch(`${apiUrl}/api/Events/event/${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch event details');
        }

        const result = await response.json();
        if (result.success) {
          const cityName = await getCityNameById(result.data.cityId);
          setEvent({ ...result.data, cityName });
        } else {
          throw new Error('Failed to load event data');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching event details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  // Handle Request to Join as a Player
  const handleRequestToJoinAsPlayer = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/screens/Login');
        return;
      }

      // Simulate an API call to request to join as a player
      // Replace this with your actual API endpoint
      setIsRegisteredAsPlayer(true);
    } catch (error) {
      console.error("Error requesting to join as player:", error);
    }
  };

  // Handle Register as Spectator
  const handleRegisterAsSpectator = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/screens/Login');
        return;
      }

      // Simulate an API call to register as a spectator
      // Replace this with your actual API endpoint
      setIsRegisteredAsSpectator(true);
    } catch (error) {
      console.error("Error registering as spectator:", error);
    }
  };

  // Handle Cancel Registration
  const handleCancelRegistration = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/screens/Login');
        return;
      }

      // Simulate an API call to cancel registration
      // Replace this with your actual API endpoint
      setIsRegisteredAsPlayer(false);
      setIsRegisteredAsSpectator(false);
    } catch (error) {
      console.error("Error canceling registration:", error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#65DA84" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-white">
        <Text className="text-red-500 mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-gray-200 px-4 py-2 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-gray-800 font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500">Event not found</Text>
        <TouchableOpacity
          className="bg-gray-200 px-4 py-2 rounded-full mt-4"
          onPress={() => router.back()}
        >
          <Text className="text-gray-800 font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">{event.eventName}</Text>

      <View className="mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-gray-700">
            <Text className="font-bold">Sport: </Text>{sportsMap[event.sportId] || 'Unknown sport'}
          </Text>
          <Text className="text-sm text-gray-700">
            <Text className="font-bold">City: </Text>{event.cityName || 'Unknown location'}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-gray-700">
            <Text className="font-bold">StartDate: </Text>{new Date(event.startDatetime).toLocaleDateString()} {new Date(event.startDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text className="text-sm text-gray-700">
            <Text className="font-bold">EndDate: </Text>{new Date(event.endDatetime).toLocaleDateString()}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-gray-700">
            <Text className="font-bold">Status: </Text>{event.status || 'N/A'}
          </Text>
          <Text className="text-sm text-gray-700">
            <Text className="font-bold">Location: </Text>{event.locationName || 'N/A'}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-gray-700">
            <Text className="font-bold">Gender: </Text>{event.gender || 'N/A'}
          </Text>
          <Text className="text-sm text-gray-700">
            <Text className="font-bold">Max Participants Number: </Text>{event.maxParticipants || 'N/A'}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-gray-700">
            <Text className="font-bold">Total Participants: </Text>{event.participantsNum || 'N/A'}
          </Text>
          <Text className="text-sm text-gray-700">
            <Text className="font-bold">Winner: </Text>{event.winner || 'N/A'}
          </Text>
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Description:</Text>
        <Text className="text-sm text-gray-700">{event.description || 'No description provided'}</Text>
      </View>

      <View className="items-center mb-4">
        <Ionicons name="location" size={40} color="#FF0000" />
      </View>

      {isRegisteredAsPlayer || isRegisteredAsSpectator ? (
        <>
          <TouchableOpacity
            className="bg-green-500 py-3 rounded-full items-center mb-4"
            onPress={handleCancelRegistration}
          >
            <Text className="text-white font-semibold">Cancel Registration</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-green-500 py-3 rounded-full items-center mb-4"
            onPress={() => console.log("Add to calendar")} // Implement calendar functionality as needed
          >
            <Text className="text-white font-semibold">Add to the calendar</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            className="bg-green-500 py-3 rounded-full items-center mb-4"
            onPress={handleRequestToJoinAsPlayer}
          >
            <Text className="text-white font-semibold">Request to Join as a Player</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-green-500 py-3 rounded-full items-center mb-4"
            onPress={handleRegisterAsSpectator}
          >
            <Text className="text-white font-semibold">Register as Spectator</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}