import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import getApiBaseUrl from '../config/apiConfig';

const apiUrl = getApiBaseUrl();

export default function MyGroupsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [token, setToken] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [citiesMap, setCitiesMap] = useState({});

  const getCityNameById = async (cityId) => {
    if (!cityId) return null;

    // Then check cache
    if (citiesMap[cityId]) {
      return citiesMap[cityId];
    }

    try {
      const resp = await fetch(
        `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${cityId}}`
      );
      const json = await resp.json();
      
      if (json.success && json.result.records.length) {
        const name = json.result.records[0]['city_name_en'] || 
                     json.result.records[0]['שם_ישוב'] || 
                     `City ${cityId}`;
        setCitiesMap(m => ({ ...m, [cityId]: name }));
        return name;
      }
    } catch (e) {
      console.error('City lookup failed', e);
    }
    return `City ${cityId}`;
  };

  const fetchGroups = useCallback(async (userToken) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/Users/groups/all`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.replace('/screens/Login');
          return;
        }
        throw new Error('Failed to fetch groups');
      }

      const result = await response.json();

      if (Array.isArray(result)) {
        // Then update with actual city names
        const updatedGroups = await Promise.all(
          result.map(async (group) => {
            const cityName = await getCityNameById(group.cityId);
            return { ...group, cityName };
          })
        );
        
        setGroups(updatedGroups);
      } else {
        setError('Failed to fetch groups');
      }
    } catch (err) {
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  }, [citiesMap]);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) {
        router.replace('/screens/Login');
        return;
      }
      setToken(storedToken);
      fetchGroups(storedToken);
    };

    checkAuth();
  }, [fetchGroups]);

  // Add focus listener to refetch groups when screen is revisited
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (token) {
        fetchGroups(token);
      }
    });

    return unsubscribe; // Clean up listener on unmount
  }, [navigation, token, fetchGroups]);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const renderGroup = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/screens/GroupDetails?groupId=${item.groupId}`)}
      className="flex-row items-center bg-green-50 p-4 my-2 rounded-lg border border-green-800"
    >
      <View className="w-12 h-12 rounded-full bg-green-300 justify-center items-center">
        <Image
          source={{ uri: item.groupImage ? `${apiUrl}/Images/${item.groupImage}` : `${apiUrl}/Images/default_group.png`}}
          className="w-10 h-10 rounded-full"
        />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-bold text-gray-900">{item.groupName}</Text>
        <Text className="text-sm text-gray-500 mt-1">
          {item.cityName || 'Unknown Location'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#65DA84" />
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
      {/* Header with Back Button and Title */}
      <View className="flex-row items-center mb-6">
        <TouchableOpacity 
          onPress={handleGoBack}
          className="p-2 -ml-2"
        >
          <Ionicons name="arrow-back" size={24} color="#65DA84" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-green-500 ml-2">My Groups</Text>
      </View>

      {error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 mb-4">{error}</Text>
          <TouchableOpacity
            className="bg-green-800 px-6 py-2 rounded-full"
            onPress={() => fetchGroups(token)}
          >
            <Text className="text-gray-800 font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : groups.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 mb-4">You haven't joined any groups yet</Text>
          <TouchableOpacity
            className="bg-gray-200 px-6 py-2 rounded-full"
            onPress={handleGoBack}
          >
            <Text className="text-gray-800 font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => String(item.groupId)}
          renderItem={renderGroup}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}