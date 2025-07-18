import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import getApiBaseUrl from '../config/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/group/Header';
import DetailsCard from '../components/group/DetailsCard';
import TeamMembers from '../components/group/TeamMembers';
import JoinRequestButton from '../components/group/JoinRequestButton';
import JoinRequests from '../components/group/JoinRequests';
import LeaveGroupButton from '../components/group/LeaveGroupButton';
import EditGroupModal from '../components/group/EditGroupModal';
import UserDetailsModal from '../components/group/UserDetailsModal';
import AdminNotificationModal from '../components/AdminNotificationModal';

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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

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
      if (!resp.ok) {
        console.error(`City API error: ${resp.status} ${resp.statusText}`);
        return String(cityId);
      }
      const json = await resp.json();
      if (json.success && json.result.records.length) {
        const name = json.result.records[0]['city_name_en'];
        setCitiesMap(m => ({ ...m, [cityId]: name }));
        return name;
      }
      return String(cityId);
    } catch (e) {
      console.error('City lookup failed:', e);
      return String(cityId);
    }
  };

  // Fetch group details
  const fetchGroupDetails = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const r = await fetch(`${apiUrl}/api/Groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.status === 204) {
        throw new Error('No group data available');
      }
      if (!r.ok) {
        console.error(`Group API error: ${r.status} ${r.statusText}`);
        throw new Error(`Failed to fetch group details: ${r.status}`);
      }
      const contentType = r.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from group API');
      }
      const { success, data, message } = await r.json();
      if (!success) throw new Error(message || 'Failed to load group data');
      const cityName = await getCityNameById(data.cityId);
      setGroup({
        ...data,
        cityName,
      });
      setMembers([]);
      setMembersPage(1);
      setMembersDisplayCount(PAGE_SIZE);
      setRequests([]);
      setRequestsPage(1);
      setRequestsDisplayCount(PAGE_SIZE);
    } catch (e) {
      console.error('Error fetching group details:', e.message);
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
      try {
        const r = await fetch(
          `${apiUrl}/api/GroupMembers/members/${group.groupId}?page=${membersPage}&pageSize=${PAGE_SIZE}`
        );

        if (r.status === 204) {
          setMembers([]);
          setMembersHasMore(false);
          return;
        }

        if (!r.ok) {
          console.error(`Members API error: ${r.status} ${r.statusText}`);
          throw new Error(`Failed to fetch members: ${r.status}`);
        }

        const contentType = r.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format from members API');
        }

        const json = await r.json();
        if (json.success) {
          setMembers(p => (membersPage === 1 ? json.data : [...p, ...json.data]));
          setMembersHasMore(json.pagination?.hasMore || false);
        } else {
          setMembers([]);
          setMembersHasMore(false);
        }
      } catch (e) {
        console.error('Failed to load members:', e.message);
      }
    })();
  }, [group, membersPage]);

  // Fetch requests
  useEffect(() => {
    if (!group?.isAdmin) return;
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      try {
        const r = await fetch(
          `${apiUrl}/api/GroupMembers/${group.groupId}/join-requests/pending?page=${requestsPage}&pageSize=${PAGE_SIZE}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (r.status === 204) {
          setRequests([]);
          setRequestsHasMore(false);
          return;
        }
        if (!r.ok) {
          console.error(`Join requests API error: ${r.status} ${r.statusText}`);
          throw new Error(`Failed to fetch join requests: ${r.status}`);
        }
        const contentType = r.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format from join requests API');
        }
        const json = await r.json();
        if (json.success) {
          setRequests(p => (requestsPage === 1 ? json.data : [...p, ...json.data]));
          setRequestsHasMore(json.pagination?.hasMore || false);
        } else {
          setRequests([]);
          setRequestsHasMore(false);
        }
      } catch (e) {
        console.error('Failed to load join requests:', e.message);
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
        if (r.status === 204) {
          setEvents([]);
          return;
        }
        if (!r.ok) {
          console.error(`Events API error: ${r.status} ${r.statusText}`);
          throw new Error(`Failed to fetch events: ${r.status}`);
        }
        const contentType = r.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format from events API');
        }
        const json = await r.json();
        if (json.success) {
          setEvents(json.data);
        } else {
          setEvents([]);
        }
      } catch (e) {
        console.error('Failed to load events:', e.message);
      }
    })();
  }, [group]);

  // Send join request
  const handleRequestToJoin = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/joinRequest/${group.groupId}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) {
        console.error(`Join request API error: ${resp.status} ${resp.statusText}`);
        throw new Error(`Failed to send join request: ${resp.status}`);
      }
      const json = await resp.json();
      Alert.alert(json.success ? 'Success:' : 'Error:', json.message);
      if (json.success) setGroup(g => ({ ...g, hasPendingRequest: true }));
    } catch (e) {
      console.error('Failed to send join request:', e.message);
      Alert.alert('Error', 'Failed to send join request');
    }
  };

  // Cancel join request
  const handleCancelRequestToJoin = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/cancel-request`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) {
        console.error(`Cancel join request API error: ${resp.status} ${resp.statusText}`);
        throw new Error(`Failed to cancel join request: ${resp.status}`);
      }
      const json = await resp.json();
      Alert.alert(json.success ? 'Success:' : 'Error:', json.message);
      if (json.success) {
        setGroup(g => ({ ...g, hasPendingRequest: false }));
      }
    } catch (e) {
      console.error('Failed to cancel join request:', e.message);
      Alert.alert('Error', 'Failed to cancel join request');
    }
  };

  // Toggle members list (show more / hide)
  const handleToggleMembers = () => {
    if (membersHasMore) {
      setMembersPage(p => p + 1);
      setMembersDisplayCount(c => c + PAGE_SIZE);
    } else if (isMembersExpanded) {
      setMembersPage(1);
      setMembersDisplayCount(PAGE_SIZE);
    }
  };

  // Toggle join-requests list (show more / hide)
  const handleToggleRequests = () => {
    if (requestsHasMore) {
      setRequestsPage(p => p + 1);
      setRequestsDisplayCount(c => c + PAGE_SIZE);
    } else if (isRequestsExpanded) {
      setRequestsPage(1);
      setRequestsDisplayCount(PAGE_SIZE);
    }
  };

  // Leave group (with confirmation)
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
              if (!resp.ok) {
                console.error(`Leave group API error: ${resp.status} ${resp.statusText}`);
                throw new Error(`Failed to leave group: ${resp.status}`);
              }
              const json = await resp.json();
              if (json.success) {
                Alert.alert('Success', json.message || 'You left the group.');
                router.replace('../(tabs)');
              } else {
                Alert.alert('Error', json.message || 'Failed to leave group');
              }
            } catch (e) {
              console.error('Error leaving group:', e.message);
              Alert.alert('Error', 'Failed to leave group');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Remove a member (admin only)
  const handleRemoveMember = async (member) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/members/${member.userId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) {
        console.error(`Remove member API error: ${resp.status} ${resp.statusText}`);
        throw new Error(`Failed to remove member: ${resp.status}`);
      }
      const json = await resp.json();
      if (json.success) {
        setMembers(m => m.filter(x => x.userId !== member.userId));
        Alert.alert('Removed', json.message || 'Member removed successfully');
      } else {
        Alert.alert('Error', json.message || 'Failed to remove member');
      }
    } catch (e) {
      console.error('Failed to remove member:', e.message);
      Alert.alert('Error', 'Failed to remove member');
    }
  };

  // Show member details in modal
  const handleShowMemberDetails = async (member) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/users/${member.userId}/details`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) {
        console.error(`Member details API error: ${resp.status} ${resp.statusText}`);
        throw new Error(`Failed to fetch member details: ${resp.status}`);
      }
      const json = await resp.json();
      if (json.success) {
        const cityName = await getCityNameById(json.data.cityId);
        setSelectedUser({ ...json.data, cityName });
        setUserModalVisible(true);
      } else {
        Alert.alert('Error', json.message || 'Failed to load user details');
      }
    } catch (e) {
      console.error('Failed to load member details:', e.message);
      Alert.alert('Error', 'Failed to load user details');
    }
  };

  // Show join-request user details in modal
  const handleShowRequestUserDetails = async (req) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/pendingUser/${req.userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) {
        console.error(`Request user details API error: ${resp.status} ${resp.statusText}`);
        throw new Error(`Failed to fetch request user details: ${resp.status}`);
      }
      const json = await resp.json();
      if (json.success) {
        const cityName = await getCityNameById(json.data.cityId);
        setSelectedUser({ ...json.data, cityName });
        setUserModalVisible(true);
      } else {
        Alert.alert('Error', json.message || 'Failed to load user details');
      }
    } catch (e) {
      console.error('Failed to load request user details:', e.message);
      Alert.alert('Error', 'Failed to load user details');
    }
  };

  // Approve a join request
  const handleAcceptRequest = async (req) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/join-requests/${req.requestId}/approve`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) {
        console.error(`Approve join request API error: ${resp.status} ${resp.statusText}`);
        throw new Error(`Failed to approve join request: ${resp.status}`);
      }
      const json = await resp.json();
      if (json.success) {
        setRequests(r => r.filter(x => x.requestId !== req.requestId));
        Alert.alert('Accepted', json.message || 'Join request approved');
      } else {
        Alert.alert('Error', json.message || 'Failed to approve request');
      }
    } catch (e) {
      console.error('Failed to accept join request:', e.message);
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  // Reject a join request
  const handleRejectRequest = async (req) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/join-requests/${req.requestId}/reject`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) {
        console.error(`Reject join request API error: ${resp.status} ${resp.statusText}`);
        throw new Error(`Failed to reject join request: ${resp.status}`);
      }
      const json = await resp.json();
      if (json.success) {
        setRequests(r => r.filter(x => x.requestId !== req.requestId));
        Alert.alert('Rejected', json.message || 'Join request rejected');
      } else {
        Alert.alert('Error', json.message || 'Failed to reject request');
      }
    } catch (e) {
      console.error('Failed to reject join request:', e.message);
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  // Handle group updated
  const handleGroupUpdated = (updatedGroup) => {
    setGroup(updatedGroup);
  };

  // Handle save group
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
          <TeamMembers
            members={members}
            displayCount={membersDisplayCount}
            pageSize={PAGE_SIZE}
            hasMore={membersHasMore}
            onToggle={handleToggleMembers}
            isAdmin={group.isAdmin}
            currentUserId={currentUserId}
            onShowDetails={isLoggedIn ? handleShowMemberDetails : null}
            onRemove={isLoggedIn ? handleRemoveMember : null}
            events={events}
            isGuest={!isLoggedIn}
          />
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
            <>
              <TouchableOpacity
                className="bg-blue-500 rounded-lg p-4 mb-4"
                onPress={() => setNotificationModalVisible(true)}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="megaphone" size={20} color="#fff" />
                  <Text className="text-white text-center font-bold ml-2">
                    Send Notification to Group
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-green-300 rounded-lg p-4 mb-4"
                onPress={() => setEditModalVisible(true)}
              >
                <Text className="text-gray-800 text-center font-bold">Edit Group</Text>
              </TouchableOpacity>
            </>
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

        <AdminNotificationModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
          groupId={group.groupId}
        />
      </View>
    </SafeAreaView>
  );
}