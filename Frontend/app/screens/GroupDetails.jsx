import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import getApiBaseUrl from '../config/apiConfig';

const apiUrl = getApiBaseUrl();

export default function GroupDetails() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams();

  // State
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sportsMap, setSportsMap] = useState({});
  const [citiesMap, setCitiesMap] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Dummy data until APIs are ready
  const dummyMembers = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];
  const dummyRequests = [
    { id: 3, name: 'Charlie' },
  ];
  const dummyUpcomingEvents = [
    { id: 10, name: 'Friendly Match', date: '2025-06-01' },
  ];

  // Load sports map
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('sportsMap');
        if (stored) setSportsMap(JSON.parse(stored));
        else setSportsMap({ 1: 'Football', 2: 'Basketball', 3: 'Marathon' });
      } catch {
        setSportsMap({ 1: 'Football', 2: 'Basketball', 3: 'Marathon' });
      }
    })();
  }, []);

  // Check login
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setIsLoggedIn(!!token);
    })();
  }, []);

  // Fetch city name
  const getCityNameById = async (cityId) => {
    try {
      const resp = await fetch(
        `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${cityId}}`
      );
      const json = await resp.json();
      if (json.success && json.result.records.length) {
        const name = json.result.records[0]['city_name_en'];
        setCitiesMap(m => ({ ...m, [cityId]: name }));
        return name;
      }
    } catch (e) {
      console.error('City lookup failed', e);
    }
    return null;
  };

  // Fetch group details
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(
          `${apiUrl}/api/Groups/${groupId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error('Failed to fetch group details');
        const result = await response.json();
        if (!result.success) throw new Error('Failed to load group data');

        const d = result.data;
        const cityName = await getCityNameById(d.cityId);

        setGroup({
          groupId: d.groupId,
          groupName: d.groupName,
          description: d.description,
          sportId: d.sportId,
          groupImage: d.groupImage,
          cityId: d.cityId,
          cityName,
          foundedAt: d.foundedAt,
          maxMembers: d.maxMemNum,
          totalMembers: d.totalMembers,
          minAge: d.minAge,
          gender: d.gender,
          matches: d.matches,
          wins: d.wins,
          losses: d.loses,
          isMember: d.isMember,
          isAdmin: d.isAdmin,
        });
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  // Handlers
  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => console.log('Left group') },
      ]
    );
  };
  const handleRemoveMember = (m) => {
    Alert.alert(
      'Remove Member',
      `Remove ${m.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => console.log('Removed', m) },
      ]
    );
  };
  const handleRequestToJoin = () => {
    console.log('Requested to join');
  };
  const handleAcceptRequest = (r) => {
    Alert.alert(
      'Accept Request',
      `Accept ${r.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => console.log('Accepted', r) },
      ]
    );
  };
  const handleRejectRequest = (r) => {
    Alert.alert(
      'Reject Request',
      `Reject ${r.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => console.log('Rejected', r) },
      ]
    );
  };
  const handleSendNotification = () => {
    console.log('Notification sent:', notificationMessage);
    setNotificationMessage('');
  };
  const handleEditGroup = () => setModalVisible(true);
  const handleSaveGroup = () => {
    console.log('Saved group details', group);
    setModalVisible(false);
  };

  // Loading & Error
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#65DA84" />
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-gray-50">
        <Text className="text-red-500 mb-4">{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-white px-4 py-2 rounded-full shadow"
        >
          <Text className="text-gray-800 font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
    <ScrollView className="p-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text className="text-3xl font-extrabold text-gray-900 flex-1 text-center">
          {group.groupName}
        </Text>
        <Image
          source={{ uri: group.groupImage }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
        />
      </View>
      <View className="h-px bg-green-400 mb-4" />

      {/* Details + Description */}
      <View className="bg-white p-4 rounded-xl shadow mb-4">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Details</Text>
        <Text className="text-green-800 font-bold text-lg mb-4 leading-relaxed">
          {group.description}
        </Text>
        <View className="space-y-3">
          {[
            ['Sport', sportsMap[group.sportId] || '—'],
            ['City', group.cityName || '—'],
            ['Members', `${group.totalMembers}/${group.maxMembers}`],
            ['Min Age', group.minAge],
            ['Gender', group.gender],
            ['Matches', group.matches],
            ['W / L', `${group.wins}/${group.losses}`]
          ].map(([label, value]) => (
            <View key={label} className="flex-row justify-between">
              <Text className="text-gray-700 text-lg">{label}</Text>
              <Text className="text-gray-900 font-medium text-lg">{value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="h-px bg-green-400 mb-4" />

        {/* Team Members & Upcoming */}
        {isLoggedIn && (
          <View className="bg-white p-4 rounded-xl shadow mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-2">Team Members</Text>
            {dummyMembers.map(m => (
              <View key={m.id} className="flex-row justify-between py-2">
                <Text className="text-gray-700 text-lg">{m.name}</Text>
                {group.isAdmin && (
                  <TouchableOpacity onPress={() => handleRemoveMember(m)}>
                    <Ionicons name="trash" size={20} color="#E53E3E" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <View className="mt-4">
              <Text className="text-lg font-semibold text-gray-800 mb-2">Upcoming Events</Text>
              {dummyUpcomingEvents.map(ev => (
                <View key={ev.id} className="flex-row justify-between py-2">
                  <Text className="text-gray-700 text-lg">{ev.name}</Text>
                  <Text className="text-gray-700 text-lg">{new Date(ev.date).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Separator */}
        <View className="h-px bg-green-400 mb-4" />

        {/* Join / Requests */}
        {isLoggedIn && !group.isMember && (
          <TouchableOpacity
            className="bg-green-500 py-3 rounded-full mb-4"
            onPress={handleRequestToJoin}
          >
            <Text className="text-white text-center font-bold">Request to Join</Text>
          </TouchableOpacity>
        )}

        {isLoggedIn && group.isAdmin && (
          <View className="bg-white p-4 rounded-xl shadow mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-2">Join Requests</Text>
            {dummyRequests.map(r => (
              <View key={r.id} className="flex-row justify-between py-2">
                <Text className="text-gray-700">{r.name}</Text>
                <View className="flex-row space-x-2">
                  <TouchableOpacity onPress={() => handleAcceptRequest(r)}>
                    <Ionicons name="checkmark-circle" size={24} color="#38A169" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRejectRequest(r)}>
                    <Ionicons name="close-circle" size={24} color="#E53E3E" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Separator */}
        <View className="h-px bg-green-400 mb-4" />

        {/* Notification & Actions */}
        {isLoggedIn && group.isAdmin && (
          <View className="bg-white p-4 rounded-xl shadow mb-6">
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              placeholder="Type notification message..."
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              multiline
            />
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-full ${notificationMessage.trim() ? 'bg-green-500' : 'bg-gray-300'}`}
                onPress={handleSendNotification}
                disabled={!notificationMessage.trim()}
              >
                <Text className="text-white text-center font-bold">Send Notification</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-full bg-blue-500"
                onPress={handleEditGroup}
              >
                <Text className="text-white text-center font-bold">Edit Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Leave Group */}
        {isLoggedIn && group.isMember && !group.isAdmin && (
          <View className="items-center mb-8">
            <TouchableOpacity
              className="bg-red-500 py-3 px-8 rounded-full shadow"
              onPress={handleLeaveGroup}
            >
              <Text className="text-white text-center font-bold">Leave Group</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Edit Group Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white w-11/12 p-6 rounded-xl shadow-lg">
            <Text className="text-xl font-bold mb-4 text-gray-800">Edit Group Details</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              value={group.groupName}
              onChangeText={t => setGroup(g => ({ ...g, groupName: t }))}
              placeholder="Group Name"
            />
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              value={group.description}
              onChangeText={t => setGroup(g => ({ ...g, description: t }))}
              placeholder="Description"
              multiline
            />
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              value={String(group.maxMembers)}
              onChangeText={t => setGroup(g => ({ ...g, maxMembers: parseInt(t) || 0 }))}
              placeholder="Max Members"
              keyboardType="numeric"
            />
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              value={String(group.minAge)}
              onChangeText={t => setGroup(g => ({ ...g, minAge: parseInt(t) || 0 }))}
              placeholder="Min Age"
              keyboardType="numeric"
            />
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="bg-gray-200 py-2 px-4 rounded-full"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-800">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-blue-500 py-2 px-4 rounded-full"
                onPress={handleSaveGroup}
              >
                <Text className="text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Guest Footer */}
      {!isLoggedIn && (
        <View className="bg-white p-4 border-t border-gray-200">
          <TouchableOpacity
            className="bg-gray-200 py-3 rounded-full"
            onPress={() => router.push('/login')}
          >
            <Text className="text-gray-800 text-center font-bold">Log in to see more</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}