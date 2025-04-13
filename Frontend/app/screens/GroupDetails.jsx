// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Image,
//   Modal,
//   TextInput,
//   Alert,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import getApiBaseUrl from '../config/apiConfig';

// const apiUrl = getApiBaseUrl();
// const PAGE_SIZE = 3;

// export default function GroupDetails() {
//   const router = useRouter();
//   const { groupId } = useLocalSearchParams();

//   // State
//   const [group, setGroup] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [sportsMap, setSportsMap] = useState({});
//   const [citiesMap, setCitiesMap] = useState({});
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [currentUserId, setCurrentUserId] = useState(null);

//   // Members pagination state
//   const [members, setMembers] = useState([]);
//   const [membersPage, setMembersPage] = useState(1);
//   const [membersHasMore, setMembersHasMore] = useState(false);
//   const [membersDisplayCount, setMembersDisplayCount] = useState(PAGE_SIZE);

//   // Requests pagination state
//   const [requests, setRequests] = useState([]);
//   const [requestsPage, setRequestsPage] = useState(1);
//   const [requestsHasMore, setRequestsHasMore] = useState(false);
//   const [requestsDisplayCount, setRequestsDisplayCount] = useState(PAGE_SIZE);

//   // Events
//   const [events, setEvents] = useState([]);

//   // Other UI state
//   const [notificationMessage, setNotificationMessage] = useState('');
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [userModalVisible, setUserModalVisible] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);

//   // Load sports map
//   useEffect(() => {
//     (async () => {
//       try {
//         const stored = await AsyncStorage.getItem('sportsMap');
//         if (stored) setSportsMap(JSON.parse(stored));
//         else setSportsMap({ 1: 'Football', 2: 'Basketball', 3: 'Marathon' });
//       } catch {
//         setSportsMap({ 1: 'Football', 2: 'Basketball', 3: 'Marathon' });
//       }
//     })();
//   }, []);

//   // Check login & load current user
//   useEffect(() => {
//     (async () => {
//       const token = await AsyncStorage.getItem('token');
//       const uid = await AsyncStorage.getItem('userId');
//       setIsLoggedIn(!!token);
//       if (uid) setCurrentUserId(parseInt(uid, 10));
//     })();
//   }, []);

//   // Helper to fetch city name
//   const getCityNameById = async (cityId) => {
//     if (citiesMap[cityId]) return citiesMap[cityId];
//     try {
//       const resp = await fetch(
//         `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${cityId}}`
//       );
//       const json = await resp.json();
//       if (json.success && json.result.records.length) {
//         const name = json.result.records[0]['city_name_en'];
//         setCitiesMap(m => ({ ...m, [cityId]: name }));
//         return name;
//       }
//     } catch (e) {
//       console.error('City lookup failed', e);
//     }
//     return String(cityId);
//   };

//   // Fetch group details
//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         const token = await AsyncStorage.getItem('token');
//         const resp = await fetch(`${apiUrl}/api/Groups/${groupId}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (!resp.ok) throw new Error('Failed to fetch group details');
//         const result = await resp.json();
//         if (!result.success) throw new Error(result.message || 'Failed to load group data');
//         const d = result.data;
//         const cityName = await getCityNameById(d.cityId);
//         setGroup({
//           groupId: d.groupId,
//           groupName: d.groupName,
//           description: d.description,
//           sportId: d.sportId,
//           groupImage: d.groupImage,
//           cityId: d.cityId,
//           cityName,
//           foundedAt: d.foundedAt,
//           maxMembers: d.maxMemNum,
//           totalMembers: d.totalMembers,
//           minAge: d.minAge,
//           gender: d.gender,
//           matches: d.matches,
//           wins: d.wins,
//           losses: d.loses,
//           isMember: d.isMember,
//           isAdmin: d.isAdmin,
//           hasPendingRequest: d.hasPendingRequest, // new flag
//         });
//         // Reset pagination on group change
//         setMembers([]);
//         setMembersPage(1);
//         setMembersDisplayCount(PAGE_SIZE);
//         setRequests([]);
//         setRequestsPage(1);
//         setRequestsDisplayCount(PAGE_SIZE);
//       } catch (e) {
//         console.error(e);
//         setError(e.message);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [groupId]);

//   // Fetch members (paginated)
//   useEffect(() => {
//     if (!group) return;
//     (async () => {
//       const token = await AsyncStorage.getItem('token');
//       try {
//         const resp = await fetch(
//           `${apiUrl}/api/GroupMembers/members/${group.groupId}?page=${membersPage}&pageSize=${PAGE_SIZE}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const json = await resp.json();
//         if (json.success) {
//           setMembers(prev => membersPage === 1 ? json.data : [...prev, ...json.data]);
//           setMembersHasMore(json.pagination.hasMore);
//         }
//       } catch (e) {
//         console.error('Failed to load members', e);
//       }
//     })();
//   }, [group, membersPage]);

//   // Fetch join requests (paginated)
//   useEffect(() => {
//     if (!group?.isAdmin) return;
//     (async () => {
//       const token = await AsyncStorage.getItem('token');
//       try {
//         const resp = await fetch(
//           `${apiUrl}/api/GroupMembers/${group.groupId}/join-requests/pending?page=${requestsPage}&pageSize=${PAGE_SIZE}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const json = await resp.json();
//         if (json.success) {
//           setRequests(prev => requestsPage === 1 ? json.data : [...prev, ...json.data]);
//           setRequestsHasMore(json.pagination.hasMore);
//         }
//       } catch (e) {
//         console.error('Failed to load join requests', e);
//       }
//     })();
//   }, [group, requestsPage]);

//   // Fetch upcoming events
//   useEffect(() => {
//     if (!group) return;
//     (async () => {
//       const token = await AsyncStorage.getItem('token');
//       try {
//         const resp = await fetch(
//           `${apiUrl}/api/Groups/${group.groupId}/upcoming-events?page=1&pageSize=10`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const json = await resp.json();
//         if (json.success) setEvents(json.data);
//       } catch (e) {
//         console.error('Failed to load events', e);
//       }
//     })();
//   }, [group]);

//   // Handlers
//   const handleRequestToJoin = async () => {
//     const token = await AsyncStorage.getItem('token');
//     try {
//       const resp = await fetch(
//         `${apiUrl}/api/GroupMembers/joinRequest/${group.groupId}`,
//         { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
//       );
//       const json = await resp.json();
//       Alert.alert(json.success ? 'Success:' : 'Error:', json.message);
//       console.log(json.success ? 'Success:' : 'Error:', json.message);
//       if (json.success) {
//         setGroup(g => ({ ...g, hasPendingRequest: true }));
//       }
//     } catch {
//       Alert.alert('Error', 'Failed to send join request');
//       console.log('Error', 'Failed to send join request');
//     }
//   };

//   const handleLoadMoreMembers = () => {
//     if (membersDisplayCount < members.length) {
//       setMembersDisplayCount(c => Math.min(c + PAGE_SIZE, members.length));
//     } else if (membersHasMore) {
//       setMembersPage(p => p + 1);
//       setMembersDisplayCount(c => c + PAGE_SIZE);
//     }
//   };

//   const handleToggleMembers = () => {
//     if (membersDisplayCount > PAGE_SIZE) {
//       setMembersDisplayCount(PAGE_SIZE);
//     } else {
//       handleLoadMoreMembers();
//     }
//   };

//   const handleLoadMoreRequests = () => {
//     if (requestsDisplayCount < requests.length) {
//       setRequestsDisplayCount(c => Math.min(c + PAGE_SIZE, requests.length));
//     } else if (requestsHasMore) {
//       setRequestsPage(p => p + 1);
//       setRequestsDisplayCount(c => c + PAGE_SIZE);
//     }
//   };

//   const handleToggleRequests = () => {
//     if (requestsDisplayCount > PAGE_SIZE) {
//       setRequestsDisplayCount(PAGE_SIZE);
//     } else {
//       handleLoadMoreRequests();
//     }
//   };

//   const handleLeaveGroup = async () => {
//     const token = await AsyncStorage.getItem('token');
//     try {
//       const resp = await fetch(
//         `${apiUrl}/api/GroupMembers/${group.groupId}/leave`,
//         { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
//       );
//       const json = await resp.json();
//       if (json.success) router.back(); else Alert.alert('Error', json.message);
//     } catch {
//       Alert.alert('Error', 'Failed to leave group');
//     }
//   };

//   const handleRemoveMember = async (member) => {
//     const token = await AsyncStorage.getItem('token');
//     try {
//       const resp = await fetch(
//         `${apiUrl}/api/GroupMembers/${group.groupId}/members/${member.userId}`,
//         { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
//       );
//       const json = await resp.json();
//       if (json.success) setMembers(m => m.filter(x => x.userId !== member.userId));
//       Alert.alert(json.success ? 'Removed' : 'Error', json.message);
//     } catch {
//       Alert.alert('Error', 'Failed to remove member');
//     }
//   };

//   const handleShowMemberDetails = async (member) => {
//     const token = await AsyncStorage.getItem('token');
//     try {
//       const resp = await fetch(
//         `${apiUrl}/api/GroupMembers/${group.groupId}/users/${member.userId}/details`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       const json = await resp.json();
//       if (json.success) {
//         const cityName = await getCityNameById(json.data.cityId);
//         setSelectedUser({ ...json.data, cityName });
//         setUserModalVisible(true);
//       } else Alert.alert('Error', json.message);
//     } catch {
//       Alert.alert('Error', 'Failed to load user details');
//     }
//   };

//   const handleShowRequestUserDetails = async (req) => {
//     const token = await AsyncStorage.getItem('token');
//     try {
//       const resp = await fetch(
//         `${apiUrl}/api/GroupMembers/${group.groupId}/pendingUser/${req.userId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       const json = await resp.json();
//       if (json.success) {
//         const cityName = await getCityNameById(json.data.cityId);
//         setSelectedUser({ ...json.data, cityName });
//         setUserModalVisible(true);
//       } else Alert.alert('Error', json.message);
//     } catch {
//       Alert.alert('Error', 'Failed to load user details');
//     }
//   };

//   const handleAcceptRequest = async (req) => {
//     const token = await AsyncStorage.getItem('token');
//     try {
//       const resp = await fetch(
//         `${apiUrl}/api/GroupMembers/${group.groupId}/join-requests/${req.requestId}/approve`,
//         { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
//       );
//       const json = await resp.json();
//       if (json.success) setRequests(r => r.filter(x => x.requestId !== req.requestId));
//       Alert.alert(json.success ? 'Accepted' : 'Error', json.message);
//     } catch {
//       Alert.alert('Error', 'Failed to accept request');
//     }
//   };

//   const handleRejectRequest = async (req) => {
//     const token = await AsyncStorage.getItem('token');
//     try {
//       const resp = await fetch(
//         `${apiUrl}/api/GroupMembers/${group.groupId}/join-requests/${req.requestId}/reject`,
//         { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
//       );
//       const json = await resp.json();
//       if (json.success) setRequests(r => r.filter(x => x.requestId !== req.requestId));
//       Alert.alert(json.success ? 'Rejected' : 'Error', json.message);
//     } catch {
//       Alert.alert('Error', 'Failed to reject request');
//     }
//   };

//   const handleSendNotification = () => {
//     Alert.alert('Notification', 'Feature not implemented');
//     setNotificationMessage('');
//   };

//   const handleSaveGroup = () => {
//     Alert.alert('Saved', 'Group details saved');
//     setEditModalVisible(false);
//   };

//   if (loading) {
//     return (
//       <View className="flex-1 justify-center items-center bg-gray-50">
//         <ActivityIndicator size="large" color="#65DA84" />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View className="flex-1 justify-center items-center p-4 bg-gray-50">
//         <Text className="text-red-500 mb-4">{error}</Text>
//         <TouchableOpacity onPress={() => router.back()} className="bg-white px-4 py-2 rounded-full shadow">
//           <Text className="text-gray-800 font-medium">Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View className="flex-1 bg-gray-50">
//       <ScrollView className="p-6">
//         {/* Header */}
//         <View className="flex-row items-center justify-between mb-4">
//           <TouchableOpacity onPress={() => router.back()}>
//             <Ionicons name="arrow-back" size={28} color="#333" />
//           </TouchableOpacity>
//           <Text className="text-3xl font-extrabold text-gray-900 flex-1 text-center">{group.groupName}</Text>
//           <Image source={{ uri: `${apiUrl}/Images/${group.groupImage}` }} style={{ width: 48, height: 48, borderRadius: 24 }} />
//         </View>
//         <View className="h-px bg-green-400 mb-4" />

//         {/* Details */}
//         <View className="bg-white p-4 rounded-xl shadow mb-4">
//           <Text className="text-lg font-semibold text-gray-800 mb-3">Details</Text>
//           <Text className="text-green-800 font-bold text-lg mb-4 leading-relaxed">{group.description}</Text>
//           <View className="space-y-3">
//             {[
//               ['Sport', sportsMap[group.sportId] || '—'],
//               ['City', group.cityName || '—'],
//               ['Members', `${group.totalMembers}/${group.maxMembers}`],
//               ['Min Age', group.minAge],
//               ['Gender', group.gender],
//               ['Matches', group.matches],
//               ['W / L', `${group.wins}/${group.losses}`],
//             ].map(([label, value]) => (
//               <View key={label} className="flex-row justify-between">
//                 <Text className="text-gray-700 text-lg">{label}</Text>
//                 <Text className="text-gray-900 font-medium text-lg">{value}</Text>
//               </View>
//             ))}
//           </View>
//         </View>

//         <View className="h-px bg-green-400 mb-4" />

//         {/* Team Members */}
//         {isLoggedIn && (
//           <View className="bg-white p-4 rounded-xl shadow mb-4">
//             <Text className="text-lg font-semibold text-gray-800 mb-2">Team Members</Text>
//             {members.length === 0 ? (
//               <Text className="text-gray-600">There are no team members in this group.</Text>
//             ) : (
//               members.slice(0, membersDisplayCount).map(m => (
//                 <View key={m.userId} className="flex-row justify-between items-center py-3 border-b border-gray-200">
//                   <View className="flex-row items-center space-x-3">
//                     <Image
//                       source={{ uri: `${apiUrl}/Images/${m.groupMemberImage}` }}
//                       className="w-10 h-10 rounded-full"
//                     />
//                     <View>
//                       <Text className="text-gray-800 text-base font-medium">{m.groupMemberName}</Text>
//                       <Text className="text-gray-500 text-sm">Since {m.joinYear}</Text>
//                     </View>
//                   </View>
//                   {group.isAdmin && m.userId !== currentUserId && (
//                     <View className="flex-row space-x-3 items-center">
//                       <TouchableOpacity onPress={() => handleShowMemberDetails(m)}>
//                         <Text className="text-blue-600 border border-blue-600 px-4 py-1 rounded-full hover:bg-blue-600 hover:text-white transition duration-200">
//                           Details
//                         </Text>
//                       </TouchableOpacity>
//                       {!m.isAdmin && (
//                         <TouchableOpacity onPress={() => handleRemoveMember(m)}>
//                           <Ionicons name="trash" size={20} color="#E53E3E" />
//                         </TouchableOpacity>
//                       )}
//                     </View>
//                   )}
//                 </View>
//               ))
//             )}
//             {(members.length > PAGE_SIZE || membersHasMore) && (
//               <TouchableOpacity onPress={handleToggleMembers} className="mt-2 py-2">
//                 <Text className="text-blue-600 text-center">{!membersHasMore ? 'Hide' : 'Show More'}</Text>
//               </TouchableOpacity>
//             )}

//             {/* Upcoming Events */}
//             <View className="mt-4">
//               <Text className="text-lg font-semibold text-gray-800 mb-2">Upcoming Events</Text>
//               {events.length === 0 ? (
//                 <Text className="text-gray-600">There are no upcoming events at the moment.</Text>
//               ) : (
//                 events.map(ev => (
//                   <View key={ev.eventId} className="flex-row justify-between py-2">
//                     <Text className="text-gray-700 text-lg">{ev.eventName}</Text>
//                     <Text className="text-gray-700 text-lg">{new Date(ev.startDatetime).toLocaleDateString('en-CA')}</Text>
//                   </View>
//                 ))
//               )}
//             </View>
//           </View>
//         )}

//         <View className="h-px bg-green-400 mb-4" />

//         {/* Join / Request Button */}
//         {isLoggedIn && !group.isMember && !group.isAdmin && (
//           group.hasPendingRequest ? (
//             <TouchableOpacity className="bg-gray-300 py-3 rounded-full mb-4" disabled>
//               <Text className="text-gray-600 text-center font-bold">Request Pending</Text>
//             </TouchableOpacity>
//           ) : (
//             <TouchableOpacity className="bg-green-500 py-3 rounded-full mb-4" onPress={handleRequestToJoin}>
//               <Text className="text-white text-center font-bold">Request to Join</Text>
//             </TouchableOpacity>
//           )
//         )}

//         {/* Join Requests */}
//         {isLoggedIn && group.isAdmin && (
//           <View className="bg-white p-4 rounded-xl shadow mb-4">
//             <Text className="text-lg font-semibold text-gray-800 mb-2">Join Requests</Text>
//             {requests.length === 0 ? (
//               <Text className="text-gray-600">There are no pending join requests.</Text>
//             ) : (
//               requests.slice(0, requestsDisplayCount).map(r => (
//                 <View key={r.requestId} className="flex-row justify-between items-center py-2">
//                   <Image
//                     source={{ uri: `${apiUrl}/Images/${r.userPicture}` }}
//                     className="w-10 h-10 rounded-full"
//                   />
//                   <View className="flex-1 ml-3">
//                     <Text className="text-gray-700 text-lg">{r.fullName}</Text>
//                     <Text className="text-gray-500 text-sm">{new Date(r.requestDate).toLocaleDateString('en-CA')}</Text>
//                   </View>
//                   <TouchableOpacity onPress={() => handleShowRequestUserDetails(r)}>
//                     <Text className="text-blue-600 border border-blue-600 px-4 py-1 rounded-full hover:bg-blue-600 hover:text-white cursor-pointer transition duration-200">Details</Text>
//                   </TouchableOpacity>
//                   <View className="flex-row space-x-3 ml-3">
//                     <TouchableOpacity onPress={() => handleAcceptRequest(r)}>
//                       <Ionicons name="checkmark-circle" size={24} color="#38A169" />
//                     </TouchableOpacity>
//                     <TouchableOpacity onPress={() => handleRejectRequest(r)}>
//                       <Ionicons name="close-circle" size={24} color="#E53E3E" />
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               ))
//             )}
//             {(requests.length > PAGE_SIZE || requestsHasMore) && (
//               <TouchableOpacity onPress={handleToggleRequests} className="mt-2 py-2">
//                 <Text className="text-blue-600 text-center">{requestsDisplayCount > PAGE_SIZE ? 'Hide' : 'Show More'}</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         )}

//         <View className="h-px bg-green-400 mb-4" />

//         {/* Notification & Edit */}
//         {isLoggedIn && group.isAdmin && (
//           <View className="bg-white p-4 rounded-xl shadow mb-6">
//             <TextInput
//               className="border border-gray-300 rounded-lg p-3 mb-3"
//               placeholder="Type notification message..."
//               value={notificationMessage}
//               onChangeText={setNotificationMessage}
//               multiline
//             />
//             <View className="flex-row space-x-3">
//               <TouchableOpacity
//                 className={`flex-1 py-3 rounded-full ${notificationMessage.trim() ? 'bg-green-500' : 'bg-gray-300'}`}
//                 onPress={handleSendNotification}
//                 disabled={!notificationMessage.trim()}
//               >
//                 <Text className="text-white text-center font-bold">Send Notification</Text>
//               </TouchableOpacity>
//               <TouchableOpacity className="flex-1 py-3 rounded-full bg-blue-500" onPress={() => setEditModalVisible(true)}>
//                 <Text className="text-white text-center font-bold">Edit Group</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}

//         {/* Leave Group */}
//         {isLoggedIn && group.isMember && !group.isAdmin && (
//           <View className="items-center mb-8">
//             <TouchableOpacity className="bg-red-500 py-3 px-8 rounded-full shadow" onPress={handleLeaveGroup}>
//               <Text className="text-white text-center font-bold">Leave Group</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </ScrollView>

//       {/* Edit Group Modal */}
//       <Modal visible={editModalVisible} animationType="slide" transparent>
//         <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
//           <View className="bg-white w-11/12 p-6 rounded-xl shadow-lg">
//             <Text className="text-xl font-bold mb-4 text-gray-800">Edit Group Details</Text>
//             <TextInput
//               className="border border-gray-300 rounded-lg p-3 mb-3"
//               value={group.groupName}
//               onChangeText={t => setGroup(g => ({ ...g, groupName: t }))}
//               placeholder="Group Name"
//             />
//             <TextInput
//               className="border border-gray-300 rounded-lg p-3 mb-3"
//               value={group.description}
//               onChangeText={t => setGroup(g => ({ ...g, description: t }))}
//               placeholder="Description"
//               multiline
//             />
//             <TextInput
//               className="border border-gray-300 rounded-lg p-3 mb-3"
//               value={String(group.maxMembers)}
//               onChangeText={t => setGroup(g => ({ ...g, maxMembers: parseInt(t) || 0 }))}
//               placeholder="Max Members"
//               keyboardType="numeric"
//             />
//             <TextInput
//               className="border border-gray-300 rounded-lg p-3 mb-3"
//               value={String(group.minAge)}
//               onChangeText={t => setGroup(g => ({ ...g, minAge: parseInt(t) || 0 }))}
//               placeholder="Min Age"
//               keyboardType="numeric"
//             />
//             <View className="flex-row justify-end space-x-3">
//               <TouchableOpacity className="bg-gray-200 py-2 px-4 rounded-full" onPress={() => setEditModalVisible(false)}>
//                 <Text className="text-gray-800">Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity className="bg-blue-500 py-2 px-4 rounded-full" onPress={handleSaveGroup}>
//                 <Text className="text-white">Save</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* User Details Modal */}
//       <Modal visible={userModalVisible} animationType="slide" transparent>
//         <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
//           <View className="bg-white w-11/12 p-6 rounded-2xl shadow-lg">
//             {selectedUser && (
//               <>
//                 <View className="flex-row items-center mb-4 space-x-4">
//                   <Text className="text-2xl font-bold text-gray-800">{selectedUser.fullName}</Text>
//                 </View>

//                 <View className="space-y-2">
//                   <Text className="text-gray-700"><Text className="font-semibold">Bio:</Text> {selectedUser.bio}</Text>
//                   <Text className="text-gray-700"><Text className="font-semibold">Email:</Text> {selectedUser.email}</Text>
//                   <Text className="text-gray-700"><Text className="font-semibold">Age:</Text> {selectedUser.age}</Text>
//                   <Text className="text-gray-700"><Text className="font-semibold">City:</Text> {selectedUser.cityName}</Text>
//                   <Text className="text-gray-700">
//                     <Text className="font-semibold">Gender:</Text> {selectedUser.gender === 'M' ? 'Male' : selectedUser.gender === 'F' ? 'Female' : selectedUser.gender}
//                   </Text>
//                 </View>
//               </>
//             )}

//             <TouchableOpacity
//               className="mt-6 bg-gray-100 py-2 px-6 rounded-full self-end shadow-sm"
//               onPress={() => setUserModalVisible(false)}
//             >
//               <Text className="text-gray-700 font-medium">Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* Guest Footer */}
//       {!isLoggedIn && (
//         <View className="bg-white p-4 border-t border-gray-200">
//           <TouchableOpacity className="bg-gray-200 py-3 rounded-full" onPress={() => router.push('/login')}>
//             <Text className="text-gray-800 text-center font-bold">Log in to see more</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );
// }


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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import getApiBaseUrl from '../config/apiConfig';

const apiUrl = getApiBaseUrl();
const PAGE_SIZE = 3;

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
  const [currentUserId, setCurrentUserId] = useState(null);

  // Members pagination state
  const [members, setMembers] = useState([]);
  const [membersPage, setMembersPage] = useState(1);
  const [membersHasMore, setMembersHasMore] = useState(false);
  const [membersDisplayCount, setMembersDisplayCount] = useState(PAGE_SIZE);

  // Requests pagination state
  const [requests, setRequests] = useState([]);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsHasMore, setRequestsHasMore] = useState(false);
  const [requestsDisplayCount, setRequestsDisplayCount] = useState(PAGE_SIZE);

  // Events
  const [events, setEvents] = useState([]);

  // Other UI state
  const [notificationMessage, setNotificationMessage] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Derived state for toggling
  const isMembersExpanded = membersDisplayCount > PAGE_SIZE;
  const isRequestsExpanded = requestsDisplayCount > PAGE_SIZE;

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

  // Check login & load current user
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      const uid = await AsyncStorage.getItem('userId');
      setIsLoggedIn(!!token);
      if (uid) setCurrentUserId(parseInt(uid, 10));
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
        setCitiesMap((m) => ({ ...m, [cityId]: name }));
        return name;
      }
    } catch (e) {
      console.error('City lookup failed', e);
    }
    return String(cityId);
  };

  // Fetch group details
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        const resp = await fetch(`${apiUrl}/api/Groups/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error('Failed to fetch group details');
        const result = await resp.json();
        if (!result.success) throw new Error(result.message || 'Failed to load group data');
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
          hasPendingRequest: d.hasPendingRequest,
        });
        // Reset pagination on group change
        setMembers([]);
        setMembersPage(1);
        setMembersDisplayCount(PAGE_SIZE);
        setRequests([]);
        setRequestsPage(1);
        setRequestsDisplayCount(PAGE_SIZE);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  // Fetch members (paginated)
  useEffect(() => {
    if (!group) return;
    (async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        const resp = await fetch(
          `${apiUrl}/api/GroupMembers/members/${group.groupId}?page=${membersPage}&pageSize=${PAGE_SIZE}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await resp.json();
        if (json.success) {
          setMembers((prev) => (membersPage === 1 ? json.data : [...prev, ...json.data]));
          setMembersHasMore(json.pagination.hasMore);
        }
      } catch (e) {
        console.error('Failed to load members', e);
      }
    })();
  }, [group, membersPage]);

  // Fetch join requests (paginated)
  useEffect(() => {
    if (!group?.isAdmin) return;
    (async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        const resp = await fetch(
          `${apiUrl}/api/GroupMembers/${group.groupId}/join-requests/pending?page=${requestsPage}&pageSize=${PAGE_SIZE}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await resp.json();
        if (json.success) {
          setRequests((prev) => (requestsPage === 1 ? json.data : [...prev, ...json.data]));
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
      try {
        const resp = await fetch(
          `${apiUrl}/api/Groups/${group.groupId}/upcoming-events?page=1&pageSize=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await resp.json();
        if (json.success) setEvents(json.data);
      } catch (e) {
        console.error('Failed to load events', e);
      }
    })();
  }, [group]);

  // Handlers
  const handleRequestToJoin = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/joinRequest/${group.groupId}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await resp.json();
      Alert.alert(json.success ? 'Success:' : 'Error:', json.message);
      if (json.success) setGroup((g) => ({ ...g, hasPendingRequest: true }));
    } catch {
      Alert.alert('Error', 'Failed to send join request');
    }
  };

  const handleToggleMembers = () => {
    if (membersHasMore) {
      // load next page
      setMembersPage(p => p + 1);
      setMembersDisplayCount(c => c + PAGE_SIZE);
    } else if (isMembersExpanded) {
      // hide: reset to first page
      setMembersPage(1);
      setMembersDisplayCount(PAGE_SIZE);
    }
  };

  const handleToggleRequests = () => {
    if (requestsHasMore) {
      // load next page
      setRequestsPage(p => p + 1);
      setRequestsDisplayCount(c => c + PAGE_SIZE);
    } else if (isRequestsExpanded) {
      // hide: reset to first page
      setRequestsPage(1);
      setRequestsDisplayCount(PAGE_SIZE);
    }
  };

  const handleLeaveGroup = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/leave`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await resp.json();
      if (json.success) router.back(); else Alert.alert('Error', json.message);
    } catch {
      Alert.alert('Error', 'Failed to leave group');
    }
  };

  const handleRemoveMember = async (member) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/members/${member.userId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await resp.json();
      if (json.success) setMembers((m) => m.filter((x) => x.userId !== member.userId));
      Alert.alert(json.success ? 'Removed' : 'Error', json.message);
    } catch {
      Alert.alert('Error', 'Failed to remove member');
    }
  };

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
      } else Alert.alert('Error', json.message);
    } catch {
      Alert.alert('Error', 'Failed to load user details');
    }
  };

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
      } else Alert.alert('Error', json.message);
    } catch {
      Alert.alert('Error', 'Failed to load user details');
    }
  };

  const handleAcceptRequest = async (req) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/join-requests/${req.requestId}/approve`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await resp.json();
      if (json.success) setRequests((r) => r.filter((x) => x.requestId !== req.requestId));
      Alert.alert(json.success ? 'Accepted' : 'Error', json.message);
    } catch {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (req) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await fetch(
        `${apiUrl}/api/GroupMembers/${group.groupId}/join-requests/${req.requestId}/reject`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await resp.json();
      if (json.success) setRequests((r) => r.filter((x) => x.requestId !== req.requestId));
      Alert.alert(json.success ? 'Rejected' : 'Error', json.message);
    } catch {
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  const handleSendNotification = () => {
    Alert.alert('Notification', 'Feature not implemented');
    setNotificationMessage('');
  };

  const handleSaveGroup = () => {
    Alert.alert('Saved', 'Group details saved');
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
    <View className="flex-1 bg-gray-50">
      <ScrollView className="p-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text className="text-3xl font-extrabold text-gray-900 flex-1 text-center">{group.groupName}</Text>
          <Image source={{ uri: `${apiUrl}/Images/${group.groupImage}` }} style={{ width: 48, height: 48, borderRadius: 24 }} />
        </View>
        <View className="h-px bg-green-400 mb-4" />

        {/* Details */}
        <View className="bg-white p-4 rounded-xl shadow mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Details</Text>
          <Text className="text-green-800 font-bold text-lg mb-4 leading-relaxed">{group.description}</Text>
          <View className="space-y-3">
            {[
              ['Sport', sportsMap[group.sportId] || '—'],
              ['City', group.cityName || '—'],
              ['Members', `${group.totalMembers}/${group.maxMembers}`],
              ['Min Age', group.minAge],
              ['Gender', group.gender],
              ['Matches', group.matches],
              ['W / L', `${group.wins}/${group.losses}`],
            ].map(([label, value]) => (
              <View key={label} className="flex-row justify-between">
                <Text className="text-gray-700 text-lg">{label}</Text>
                <Text className="text-gray-900 font-medium text-lg">{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="h-px bg-green-400 mb-4" />

        {/* Team Members */}
        {isLoggedIn && (
          <View className="bg-white p-4 rounded-xl shadow mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-2">Team Members</Text>
            {members.length === 0 ? (
              <Text className="text-gray-600">There are no team members in this group.</Text>
            ) : (
              members.slice(0, membersDisplayCount).map((m) => (
                <View key={m.userId} className="flex-row justify-between items-center py-3 border-b border-gray-200">
                  <View className="flex-row items-center space-x-3">
                    <Image
                      source={{ uri: `${apiUrl}/Images/${m.groupMemberImage}` }}
                      className="w-10 h-10 rounded-full"
                    />
                    <View>
                      <Text className="text-gray-800 text-base font-medium">{m.groupMemberName}</Text>
                      <Text className="text-gray-500 text-sm">Since {m.joinYear}</Text>
                    </View>
                  </View>
                  {group.isAdmin && m.userId !== currentUserId && (
                    <View className="flex-row space-x-3 items-center">
                      <TouchableOpacity onPress={() => handleShowMemberDetails(m)}>
                        <Text className="text-blue-600 border border-blue-600 px-4 py-1 rounded-full hover:bg-blue-600 hover:text-white transition duration-200">
                          Details
                        </Text>
                      </TouchableOpacity>
                      {!m.isAdmin && (
                        <TouchableOpacity onPress={() => handleRemoveMember(m)}>
                          <Ionicons name="trash" size={20} color="#E53E3E" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
            {(membersDisplayCount > PAGE_SIZE || membersHasMore) && (
              <TouchableOpacity onPress={handleToggleMembers} className="mt-2 py-2">
                <Text className="text-blue-600 text-center">
                  {membersHasMore ? 'Show More' : (isMembersExpanded ? 'Hide' : 'Show More')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Upcoming Events */}
            <View className="mt-4">
              <Text className="text-lg font-semibold text-gray-800 mb-2">Upcoming Events</Text>
              {events.length === 0 ? (
                <Text className="text-gray-600">There are no upcoming events at the moment.</Text>
              ) : (
                events.map((ev) => (
                  <View key={ev.eventId} className="flex-row justify-between py-2">
                    <Text className="text-gray-700 text-lg">{ev.eventName}</Text>
                    <Text className="text-gray-700 text-lg">{new Date(ev.startDatetime).toLocaleDateString('en-CA')}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        <View className="h-px bg-green-400 mb-4" />

        {/* Join / Request Button */}
        {isLoggedIn && !group.isMember && !group.isAdmin && (
          group.hasPendingRequest ? (
            <TouchableOpacity className="bg-gray-300 py-3 rounded-full mb-4" disabled>
              <Text className="text-gray-600 text-center font-bold">Request Pending</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity className="bg-green-500 py-3 rounded-full mb-4" onPress={handleRequestToJoin}>
              <Text className="text-white text-center font-bold">Request to Join</Text>
            </TouchableOpacity>
          )
        )}

        {/* Join Requests */}
        {isLoggedIn && group.isAdmin && (
          <View className="bg-white p-4 rounded-xl shadow mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-2">Join Requests</Text>
            {requests.length === 0 ? (
              <Text className="text-gray-600">There are no pending join requests.</Text>
            ) : (
              requests.slice(0, requestsDisplayCount).map((r) => (
                <View key={r.requestId} className="flex-row justify-between items-center py-2">
                  <Image
                    source={{ uri: `${apiUrl}/Images/${r.userPicture}` }}
                    className="w-10 h-10 rounded-full"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-700 text-lg">{r.fullName}</Text>
                    <Text className="text-gray-500 text-sm">{new Date(r.requestDate).toLocaleDateString('en-CA')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleShowRequestUserDetails(r)}>
                    <Text className="text-blue-600 border border-blue-600 px-4 py-1 rounded-full hover:bg-blue-600 hover:text-white cursor-pointer transition duration-200">Details</Text>
                  </TouchableOpacity>
                  <View className="flex-row space-x-3 ml-3">
                    <TouchableOpacity onPress={() => handleAcceptRequest(r)}>
                      <Ionicons name="checkmark-circle" size={24} color="#38A169" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRejectRequest(r)}>
                      <Ionicons name="close-circle" size={24} color="#E53E3E" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            {(requestsDisplayCount > PAGE_SIZE || requestsHasMore) && (
              <TouchableOpacity onPress={handleToggleRequests} className="mt-2 py-2">
                <Text className="text-blue-600 text-center">
                  {requestsHasMore ? 'Show More' : (isRequestsExpanded ? 'Hide' : 'Show More')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View className="h-px bg-green-400 mb-4" />

        {/* Notification & Edit */}
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
              <TouchableOpacity className="flex-1 py-3 rounded-full bg-blue-500" onPress={() => setEditModalVisible(true)}>
                <Text className="text-white text-center font-bold">Edit Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Leave Group */}
        {isLoggedIn && group.isMember && !group.isAdmin && (
          <View className="items-center mb-8">
            <TouchableOpacity className="bg-red-500 py-3 px-8 rounded-full shadow" onPress={handleLeaveGroup}>
              <Text className="text-white text-center font-bold">Leave Group</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Edit Group Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white w-11/12 p-6 rounded-xl shadow-lg">
            <Text className="text-xl font-bold mb-4 text-gray-800">Edit Group Details</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              value={group.groupName}
              onChangeText={(t) => setGroup((g) => ({ ...g, groupName: t }))}
              placeholder="Group Name"
            />
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              value={group.description}
              onChangeText={(t) => setGroup((g) => ({ ...g, description: t }))}
              placeholder="Description"
              multiline
            />
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              value={`${group.maxMembers}`}
              onChangeText={(t) => setGroup((g) => ({ ...g, maxMembers: parseInt(t, 10) || 0 }))}
              placeholder="Max Members"
              keyboardType="numeric"
            />
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              value={`${group.minAge}`}
              onChangeText={(t) => setGroup((g) => ({ ...g, minAge: parseInt(t, 10) || 0 }))}
              placeholder="Min Age"
              keyboardType="numeric"
            />
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity className="bg-gray-200 py-2 px-4 rounded-full" onPress={() => setEditModalVisible(false)}>
                <Text className="text-gray-800">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-blue-500 py-2 px-4 rounded-full" onPress={handleSaveGroup}>
                <Text className="text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Details Modal */}
      <Modal visible={userModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white w-11/12 p-6 rounded-2xl shadow-lg">
            {selectedUser && (
              <>
                <View className="flex-row items-center mb-4 space-x-4">
                  <Text className="text-2xl font-bold text-gray-800">{selectedUser.fullName}</Text>
                </View>

                <View className="space-y-2">
                  <Text className="text-gray-700"><Text className="font-semibold">Bio:</Text> {selectedUser.bio}</Text>
                  <Text className="text-gray-700"><Text className="font-semibold">Email:</Text> {selectedUser.email}</Text>
                  <Text className="text-gray-700"><Text className="font-semibold">Age:</Text> {selectedUser.age}</Text>
                  <Text className="text-gray-700"><Text className="font-semibold">City:</Text> {selectedUser.cityName}</Text>
                  <Text className="text-gray-700">
                    <Text className="font-semibold">Gender:</Text> {selectedUser.gender === 'M' ? 'Male' : selectedUser.gender === 'F' ? 'Female' : selectedUser.gender}
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              className="mt-6 bg-gray-100 py-2 px-6 rounded-full self-end shadow-sm"
              onPress={() => setUserModalVisible(false)}
            >
              <Text className="text-gray-700 font-medium">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Guest Footer */}
      {!isLoggedIn && (
        <View className="bg-white p-4 border-t border-gray-200">
          <TouchableOpacity className="bg-gray-200 py-3 rounded-full" onPress={() => router.push('/login')}>
            <Text className="text-gray-800 text-center font-bold">Log in to see more</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
