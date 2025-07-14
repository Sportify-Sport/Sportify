// screens/GroupDetails.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import getApiBaseUrl from '../config/apiConfig';
import { useRouter } from "expo-router";

import Header from '../components/group/Header';
import DetailsCard from '../components/group/DetailsCard';
import TeamMembers from '../components/group/TeamMembers';
import JoinRequestButton from '../components/group/JoinRequestButton';
import JoinRequests from '../components/group/JoinRequests';
import NotificationEditor from '../components/group/NotificationEditor';
import LeaveGroupButton from '../components/group/LeaveGroupButton';
import EditGroupModal from '../components/group/EditGroupModal';
import UserDetailsModal from '../components/group/UserDetailsModal';

const apiUrl = getApiBaseUrl();
const PAGE_SIZE = 3;

export default function GroupDetails() {
  const { groupId } = useLocalSearchParams();

  const router = useRouter();

  // State
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sportsMap, setSportsMap] = useState({});
  const [citiesMap, setCitiesMap] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Pagination
  const [members, setMembers] = useState([]);
  const [membersPage, setMembersPage] = useState(1);
  const [membersHasMore, setMembersHasMore] = useState(false);
  const [membersDisplayCount, setMembersDisplayCount] = useState(PAGE_SIZE);

  const [requests, setRequests] = useState([]);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsHasMore, setRequestsHasMore] = useState(false);
  const [requestsDisplayCount, setRequestsDisplayCount] = useState(PAGE_SIZE);

  const [events, setEvents] = useState([]);

  // UI state
  const [notificationMessage, setNotificationMessage] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Derived
  const isMembersExpanded = membersDisplayCount > PAGE_SIZE;
  const isRequestsExpanded = requestsDisplayCount > PAGE_SIZE;

  // Load sportsMap
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('sportsMap');
        setSportsMap(stored ? JSON.parse(stored) : { 1: 'Football', 2: 'Basketball', 3: 'Marathon' });
      } catch {
        setSportsMap({ 1: 'Football', 2: 'Basketball', 3: 'Marathon' });
      }
    })();
  }, []);

  // Check login
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      const uid = await AsyncStorage.getItem('userId');
      setIsLoggedIn(!!token);
      if (uid) setCurrentUserId(+uid);
    })();
  }, []);

  // Helper to fetch city name
  const getCityNameById = async (cityId) => {
    if (citiesMap[cityId]) return citiesMap[cityId];
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
    return String(cityId);
  };

  // Fetch group details
const fetchGroupDetails = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const r = await fetch(`${apiUrl}/api/Groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error('Failed to fetch group details');
      const { success, data, message } = await r.json();
      if (!success) throw new Error(message || 'Failed to load group data');
      const cityName = await getCityNameById(data.cityId);
      setGroup({
        ...data,
        cityName,
      });
      // Reset pagination on new group
      setMembers([]); setMembersPage(1); setMembersDisplayCount(PAGE_SIZE);
      setRequests([]); setRequestsPage(1); setRequestsDisplayCount(PAGE_SIZE);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  // Fetch members
  useEffect(() => {
    if (!group) return;
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      try {
        const r = await fetch(
          `${apiUrl}/api/GroupMembers/members/${group.groupId}?page=${membersPage}&pageSize=${PAGE_SIZE}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await r.json();
        if (json.success) {
          setMembers(p => membersPage === 1 ? json.data : [...p, ...json.data]);
          setMembersHasMore(json.pagination.hasMore);
        }
      } catch (e) {
        console.error('Failed to load members', e);
      }
    })();
  }, [group, membersPage]);

  // Fetch requests
  useEffect(() => {
    if (!group?.isAdmin) return;
    (async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        const r = await fetch(
          `${apiUrl}/api/GroupMembers/${group.groupId}/join-requests/pending?page=${requestsPage}&pageSize=${PAGE_SIZE}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await r.json();
        if (json.success) {
          setRequests(p => requestsPage === 1 ? json.data : [...p, ...json.data]);
          setRequestsHasMore(json.pagination.hasMore);
        }
      } catch (e) {
        console.error('Failed to load join requests', e);
      }
    })();
  }, [group, requestsPage]);

  // Fetch upcoming events
  useEffect(() => {
    if (!group) return;
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      try {
        const r = await fetch(
          `${apiUrl}/api/Groups/${group.groupId}/upcoming-events?page=1&pageSize=3`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const json = await r.json();
        if (json.success) setEvents(json.data);
      } catch (e) {
        console.error('Failed to load events', e);
      }
    })();
  }, [group]);

  // 1. Send join request
  const handleRequestToJoin = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/joinRequest/${group.groupId}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await resp.json();
      Alert.alert(json.success ? 'Success:' : 'Error:', json.message);
      if (json.success) setGroup(g => ({ ...g, hasPendingRequest: true }));
    } catch {
      Alert.alert('Error', 'Failed to send join request');
    }
  };
  // cancel join request
  const handleCancelRequestToJoin = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/cancel-request`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await resp.json();
      Alert.alert(json.success ? 'Success:' : 'Error:', json.message);
      if (json.success) {
        setGroup(g => ({ ...g, hasPendingRequest: false }));
      }
    } catch {
      Alert.alert('Error', 'Failed to cancel join request');
    }
  };

  // 2. Toggle members list (show more / hide)
  const handleToggleMembers = () => {
    if (membersHasMore) {
      setMembersPage(p => p + 1);
      setMembersDisplayCount(c => c + PAGE_SIZE);
    } else if (isMembersExpanded) {
      setMembersPage(1);
      setMembersDisplayCount(PAGE_SIZE);
    }
  };

  // 3. Toggle join‐requests list (show more / hide)
  const handleToggleRequests = () => {
    if (requestsHasMore) {
      setRequestsPage(p => p + 1);
      setRequestsDisplayCount(c => c + PAGE_SIZE);
    } else if (isRequestsExpanded) {
      setRequestsPage(1);
      setRequestsDisplayCount(PAGE_SIZE);
    }
  };

  // 4. Leave group (with confirmation)
  const handleLeaveGroup = async () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const resp = await fetch(
                `${apiUrl}/api/GroupMembers/${group.groupId}/leave`,
                { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
              );
              const json = await resp.json();
              if (json.success) {
                Alert.alert('Success', json.message || 'You left the group.');
                router.replace('../(tabs)');
              }
            } catch {
              console.log('Error', 'Failed to leave group.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // 5. Remove a member (admin only)
  const handleRemoveMember = async (member) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/members/${member.userId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await resp.json();
      if (json.success) setMembers(m => m.filter(x => x.userId !== member.userId));
      Alert.alert(json.success ? 'Removed' : 'Error', json.message);
    } catch {
      Alert.alert('Error', 'Failed to remove member');
    }
  };

  // 6. Show member details in modal
  const handleShowMemberDetails = async (member) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/users/${member.userId}/details`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await resp.json();
      if (json.success) {
        const cityName = await getCityNameById(json.data.cityId);
        setSelectedUser({ ...json.data, cityName });
        setUserModalVisible(true);
      } else {
        Alert.alert('Error', json.message);
      }
    } catch {
      Alert.alert('Error', 'Failed to load user details');
    }
  };

  // 7. Show join‐request user details in modal
  const handleShowRequestUserDetails = async (req) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/pendingUser/${req.userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await resp.json();
      if (json.success) {
        const cityName = await getCityNameById(json.data.cityId);
        setSelectedUser({ ...json.data, cityName });
        setUserModalVisible(true);
      } else {
        Alert.alert('Error', json.message);
      }
    } catch {
      Alert.alert('Error', 'Failed to load user details');
    }
  };

  // 8. Approve a join request
  const handleAcceptRequest = async (req) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/join-requests/${req.requestId}/approve`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await resp.json();
      if (json.success) setRequests(r => r.filter(x => x.requestId !== req.requestId));
      Alert.alert(json.success ? 'Accepted' : 'Error', json.message);
    } catch {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  // 9. Reject a join request
  const handleRejectRequest = async (req) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/join-requests/${req.requestId}/reject`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await resp.json();
      if (json.success) setRequests(r => r.filter(x => x.requestId !== req.requestId));
      Alert.alert(json.success ? 'Rejected' : 'Error', json.message);
    } catch {
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  // 10. Send notification (placeholder)
  const handleSendNotification = () => {
    Alert.alert('Notification', 'Feature not implemented');
    setNotificationMessage('');
  };

  	
  const handleGroupUpdated = (updatedGroup) => {
    setGroup(updatedGroup);
  };

  const handleSaveGroup = () => {
    Alert.alert('Saved', 'Group details saved');
    fetchGroupDetails(); 
    setEditModalVisible(false);
  };

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
        <TouchableOpacity onPress={() => router.back()} className="bg-white px-4 py-2 rounded-full shadow">
          <Text className="text-gray-800 font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 bg-gray-50">
        <ScrollView className="p-6">
          <Header
            groupName={group.groupName}
            groupImage={group.groupImage}
          />
          <DetailsCard
            group={group}
            sportsMap={sportsMap}
          />

          {isLoggedIn && (
            <TeamMembers
              members={members}
              displayCount={membersDisplayCount}
              pageSize={PAGE_SIZE}
              hasMore={membersHasMore}
              onToggle={handleToggleMembers}
              isAdmin={group.isAdmin}
              currentUserId={currentUserId}
              onShowDetails={handleShowMemberDetails}
              onRemove={handleRemoveMember}
              events={events}
            />
          )}
          <View className="h-px bg-green-400 mb-4" />
          <JoinRequestButton
            isLoggedIn={isLoggedIn}
            isMember={group.isMember}
            isAdmin={group.isAdmin}
            hasPending={group.hasPendingRequest}
            onRequest={handleRequestToJoin}
            onCancel={handleCancelRequestToJoin}
          />

          {isLoggedIn && group.isAdmin && (
            <JoinRequests
              requests={requests}
              displayCount={requestsDisplayCount}
              pageSize={PAGE_SIZE}
              hasMore={requestsHasMore}
              onToggle={handleToggleRequests}
              onDetails={handleShowRequestUserDetails}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
            />
          )}
        <View className="h-px bg-green-400 mb-4" />
          {isLoggedIn && group.isAdmin && (
            <NotificationEditor
              message={notificationMessage}
              onChange={setNotificationMessage}
              onSend={handleSendNotification}
              onEdit={() => setEditModalVisible(true)}
            />
          )}

          {isLoggedIn && group.isMember && !group.isAdmin && (
            <LeaveGroupButton onLeave={() => handleLeaveGroup(group)} />
          )}

        </ScrollView>

        <EditGroupModal
          visible={editModalVisible}
          group={group}
          setGroup={setGroup}
          onClose={() => setEditModalVisible(false)}
          onSave={handleSaveGroup}
          onGroupUpdated={handleGroupUpdated}
        />

        <UserDetailsModal
          visible={userModalVisible}
          user={selectedUser}
          onClose={() => setUserModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}





