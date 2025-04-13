import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import getApiBaseUrl from '../config/apiConfig';

const { width } = Dimensions.get('window');
const SLIDE_INTERVAL = 3000;
const apiUrl = getApiBaseUrl();

export default function Index() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [sportsList, setSportsList] = useState([]);
  const [sportsMap, setSportsMap] = useState({});
  const [myEventsList, setMyEventsList] = useState([]);
  const [myGroupsList, setMyGroupsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const slideRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // load token and cached sports map
  useEffect(() => {
    AsyncStorage.getItem('token').then((t) => setToken(t));
    AsyncStorage.getItem('sportsMap').then((m) => {
      if (m) setSportsMap(JSON.parse(m));
    });
  }, []);

  // fetch public data: recommendations and sports
  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // recommended events
    fetch(`${apiUrl}/api/Events/events/random?count=4`, { headers })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setRecommendedEvents(json.data);
        }
      })
      .catch(console.error);

    // sports
    fetch(`${apiUrl}/api/Sports`, { headers })
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json)) {
          setSportsList(json);
          // build and cache map of id->name
          const map = {};
          json.forEach((s) => {
            map[s.sportId] = s.sportName;
          });
          AsyncStorage.setItem('sportsMap', JSON.stringify(map));
          setSportsMap(map);
        }
      })
      .catch(console.error);
  }, [token]);

  // fetch user-specific data and profile
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${apiUrl}/api/Users/GetUserProfile`, { headers }).then((res) => res.json()),
      fetch(`${apiUrl}/api/Users/events/top?limit=4`, { headers }).then((res) => res.json()),
      fetch(`${apiUrl}/api/Users/groups/top4`, { headers }).then((res) => res.json()),
    ])
      .then(([profileJson, eventsJson, groupsJson]) => {
        if (profileJson.firstName) {
          setProfileName(`${profileJson.firstName} ${profileJson.lastName}`);
        }
        if (eventsJson.success && Array.isArray(eventsJson.data)) {
          setMyEventsList(eventsJson.data);
        }
        if (Array.isArray(groupsJson)) {
          setMyGroupsList(groupsJson);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  // carousel controls
  const goPrev = () => {
    const prevIndex = (currentIndex - 1 + recommendedEvents.length) % recommendedEvents.length;
    setCurrentIndex(prevIndex);
    slideRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  };
  const goNext = () => {
    const nextIndex = (currentIndex + 1) % recommendedEvents.length;
    setCurrentIndex(nextIndex);
    slideRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };
  useEffect(() => {
    const interval = setInterval(goNext, SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [currentIndex, recommendedEvents.length]);

  // renderers
  const renderSlide = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '../screens/EventDetails',
          params: { eventId: item.eventId },
        })
      }
    >
      <View style={{ width }} className="w-full">
        <Image
          source={{ uri: `${apiUrl}/Images/${item.profileImage}` }}
          className="w-full h-48 rounded-lg"
        />
        <View className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
          <Text className="text-white">{item.eventName}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSport = ({ item }) => (
    <View className="items-center mx-2">
      <Image source={{ uri: item.sportImage }} className="w-16 h-16 rounded-full" />
      <Text className="mt-1 text-sm text-gray-700">{item.sportName}</Text>
    </View>
  );

  const renderMyEvent = (item) => (
    <TouchableOpacity
      key={item.eventId}
      onPress={() => token && router.push({ pathname: "../screens/EventDetails", params: { eventId: item.eventId } })}
      disabled={!token}
    >
      <View className={`flex-row items-center rounded-lg shadow px-4 py-2 m-1 ${token ? 'bg-white' : 'bg-gray-100'}`}>
        <Image source={{ uri: `${apiUrl}/Images/${item.eventImage}`}} className="w-12 h-12 rounded" />
        <View className="ml-3">
          <Text className={`${token ? 'font-semibold text-black' : 'text-gray-500'}`}>{item.eventName}</Text>
          <Text className="text-gray-500 text-sm">{new Date(item.startDatetime).toLocaleDateString()}</Text>
          <Text className="text-gray-500 text-sm">{sportsMap[item.sportId] || 'Unknown Sport'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMyGroup = (item) => (
    <TouchableOpacity
      key={item.groupId}
      onPress={() => token && router.push({ pathname: "../screens/GroupDetails", params: { groupId: item.groupId } })}
      disabled={!token}
    >
      <View className={`flex-row items-center rounded-lg shadow px-4 py-2 m-1 ${token ? 'bg-white' : 'bg-gray-100'}`}>
        <Image source={{ uri: `${apiUrl}/Images/${item.groupImage}`}} className="w-12 h-12 rounded" />
        <View className="ml-3">
          <Text className={`${token ? 'font-semibold text-black' : 'text-gray-500'}`}>{item.groupName}</Text>
          <Text className="text-gray-500 text-sm">{sportsMap[item.sportId] || 'Unknown Sport'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#65DA84" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold">
          Welcome, {token ? profileName : 'guest'}!
        </Text>
        {!token && (
          <TouchableOpacity
            className="bg-[#65DA84] px-4 py-2 rounded-full"
            onPress={() => router.replace('/screens/Login')}
          >
            <Text className="text-white">Login</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Event Recommendations */}
      <View className="mb-6">
        <Text className="text-xl font-semibold mb-2">Event Recommendations</Text>
        <View className="relative">
          <FlatList
            data={recommendedEvents}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={renderSlide}
            keyExtractor={(item) => String(item.eventId)}
            ref={slideRef}
          />
          <TouchableOpacity onPress={goPrev} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full">
            <Text className="text-white text-xl">‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goNext} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full">
            <Text className="text-white text-xl">›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sports Section */}
      <View className="mb-6">
        <Text className="text-xl font-semibold mb-2">Sports</Text>
        <FlatList
          data={sportsList}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderSport}
          keyExtractor={(item) => String(item.sportId)}
        />
      </View>

      {/* My Events */}
      <View className="mb-6">
        <TouchableOpacity
          className="flex-row items-center mb-2"
          onPress={() => token && router.replace('../screens/MyEvents')}
          disabled={!token}
        >
          <Text className={`text-xl font-semibold ${token ? '' : 'text-gray-400'}`}>My Events</Text>
          <Text className={`${token ? 'text-[#65DA84]' : 'text-gray-400'} ml-1`}>›</Text>
        </TouchableOpacity>
        <View className="h-40">
          <ScrollView showsVerticalScrollIndicator={false}>
            {token
              ? (myEventsList.length > 0
                  ? myEventsList.map(renderMyEvent)
                  : <View className="flex-1 justify-center items-center py-8"><Text className="text-gray-500">You have no events</Text></View>
                )
              : <View className="flex-1 justify-center items-center py-8"><Text className="text-gray-500">Sign in to see your events</Text></View>
            }
          </ScrollView>
        </View>
      </View>

      {/* My Groups */}
      <View className="mb-6">
        <TouchableOpacity
          className="flex-row items-center mb-2"
          onPress={() => token && router.replace('../screens/MyGroups')}
          disabled={!token}
        >
          <Text className={`text-xl font-semibold ${token ? '' : 'text-gray-400'}`}>My Groups</Text>
          <Text className={`${token ? 'text-[#65DA84]' : 'text-gray-400'} ml-1`}>›</Text>
        </TouchableOpacity>
        <View className="h-40">
          <ScrollView showsVerticalScrollIndicator={false}>
            {token
              ? (myGroupsList.length > 0
                  ? myGroupsList.map(renderMyGroup)
                  : <View className="flex-1 justify-center items-center py-8"><Text className="text-gray-500">You have no groups</Text></View>
                )
              : <View className="flex-1 justify-center items-center py-8"><Text className="text-gray-500">Sign in to see your groups</Text></View>
            }
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}
