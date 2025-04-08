import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getApiBaseUrl from '../config/apiConfig';

const apiUrl = getApiBaseUrl();

export default function MyEventsScreen() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) {
        router.replace('/screens/Login');
        return;
      }
      setToken(storedToken);
      fetchEvents(storedToken);
    };

    checkAuth();
  }, []);

  const fetchEvents = async (userToken) => {
    try {
      const response = await fetch(`${apiUrl}/api/Users/events`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setEvents(result.data);
      } else {
        setError('Failed to load events');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderEvent = ({ item }) => (
    <TouchableOpacity className="flex-row items-center bg-white p-3 my-1 rounded-lg shadow-sm">
      <Image
        source={{ uri: `${apiUrl}/Images/${item.eventImage}` }}
        className="w-10 h-10 rounded-full"
      />
      <View className="ml-3 flex-1">
        <Text className="text-base font-bold text-gray-900">{item.eventName}</Text>
        <Text className="text-sm text-gray-500">{item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#65DA84" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">My Events</Text>

      {error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 mb-4">{error}</Text>
          <TouchableOpacity
            className="bg-gray-200 px-4 py-2 rounded-full"
            onPress={() => fetchEvents(token)}
          >
            <Text className="text-gray-800 font-medium">Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-gray-200 px-4 py-2 rounded-full mt-4"
            onPress={() => router.push('/')}
          >
            <Text className="text-gray-800 font-medium">Back to Home</Text>
          </TouchableOpacity>
        </View>
      ) : events.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 mb-4">You haven't joined any events yet</Text>
          <TouchableOpacity
            className="bg-gray-200 px-4 py-2 rounded-full"
            onPress={() => router.push('/')}
          >
            <Text className="text-gray-800 font-medium">Back to Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.eventId)}
          renderItem={renderEvent}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}