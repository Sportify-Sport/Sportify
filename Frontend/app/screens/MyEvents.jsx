import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import getApiBaseUrl from '../config/apiConfig';

const apiUrl = getApiBaseUrl();

export default function MyEventsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [token, setToken] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastEventId, setLastEventId] = useState(null);
  const [lastEventDate, setLastEventDate] = useState(null);
  const [sportsMap, setSportsMap] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) {
        router.replace('/screens/Login');
        return;
      }
      setToken(storedToken);
      
      const storedSports = await AsyncStorage.getItem('sportsMap');
      if (storedSports) {
        setSportsMap(JSON.parse(storedSports));
      }
      
      fetchEvents(storedToken);
    };

    checkAuth();
  }, []);
 	
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (token) {
        fetchEvents(token);
      }
    });
    return unsubscribe;
  }, [navigation, token]);

  const fetchEvents = async (userToken, loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setError(null);
      }

      let url = `${apiUrl}/api/Users/events/paginated?pageSize=10`;
      if (loadMore && lastEventId && lastEventDate) {
        url += `&lastEventId=${lastEventId}&lastEventDate=${encodeURIComponent(lastEventDate)}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        if (Array.isArray(result.data)) {
          setEvents(prev => loadMore ? [...prev, ...result.data] : result.data);
          setHasMore(result.hasMore ?? false);
          
          if (result.data.length > 0) {
            const lastEvent = result.data[result.data.length - 1];
            setLastEventId(lastEvent.eventId);
            setLastEventDate(lastEvent.startDatetime);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(token);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const renderEvent = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/screens/EventDetails?eventId=${item.eventId}`)}
      className="flex-row items-center bg-green-50 p-4 my-2 rounded-lg border border-green-800"
    >
      <View className="w-12 h-12 rounded-full bg-green-300 justify-center items-center">
        <Image
          source={{ uri: item.eventImage ? `${apiUrl}/Images/${item.eventImage}`: `${apiUrl}/Images/default_event.png` }}
          className="w-10 h-10 rounded-full"
        />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-bold text-gray-900">{item.eventName}</Text>
        <Text className="text-sm text-gray-600 mt-1">
          {new Date(item.startDatetime).toLocaleDateString()} •{' '}
          {new Date(item.startDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text className="text-sm text-gray-600">
          {sportsMap[item.sportId] || `Sport ID: ${item.sportId}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#65DA84" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#65DA84" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      {/* Header with Back Button and Title */}
      <View className="flex-row items-center mb-6">
        <TouchableOpacity 
          onPress={handleGoBack}
          className="p-2 -ml-2"
        >
          <Ionicons name="arrow-back" size={24} color="#65DA84" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-green-500 ml-2">My Events</Text>
      </View>

      {error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 mb-4">{error}</Text>
          <TouchableOpacity
            className="bg-green-100 px-6 py-2 rounded-full border border-blue-200"
            onPress={() => fetchEvents(token)}
          >
            <Text className="text-green-800 font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : events.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-green-600 mb-4">You haven't joined any events yet</Text>
          <TouchableOpacity
            className="bg-green-100 px-6 py-2 rounded-full border border-green-200"
            onPress={handleGoBack}
          >
            <Text className="text-green-500 font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.eventId)}
          renderItem={renderEvent}
          onEndReached={() => hasMore && fetchEvents(token, true)}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#65DA84']}
              tintColor="#65DA84"
            />
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}