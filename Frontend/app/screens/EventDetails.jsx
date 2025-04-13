// import React, { useState, useEffect } from 'react';
// import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Ionicons } from '@expo/vector-icons';
// import getApiBaseUrl from '../config/apiConfig';

// const apiUrl = getApiBaseUrl();

// export default function EventDetails() {
//   const router = useRouter();
//   const { eventId } = useLocalSearchParams();
//   const [event, setEvent] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [citiesMap, setCitiesMap] = useState({});
//   const [sportsMap, setSportsMap] = useState({});
//   const [isLoggedIn, setIsLoggedIn] = useState(false); // Track if user is logged in
//   const [isSpectator, setIsSpectator] = useState(false); // Track if user registered as spectator
//   const [isPlayerRequested, setIsPlayerRequested] = useState(false); // Track if user requested to join as player

//   // Load sports map and check login status
//   useEffect(() => {
//     const loadInitialData = async () => {
//       try {
//         // Check if user is logged in by verifying the token
//         const token = await AsyncStorage.getItem('token');
//         console.log('loadInitialData: Token from AsyncStorage:', token);
//         setIsLoggedIn(!!token); // Set to true if token exists, false otherwise

//         // Load sports map
//         const storedSports = await AsyncStorage.getItem('sportsMap');
//         if (storedSports) {
//           const parsedSportsMap = JSON.parse(storedSports);
//           console.log('loadInitialData: Sports map loaded:', parsedSportsMap);
//           setSportsMap(parsedSportsMap);
//         } else {
//           console.warn('loadInitialData: No sports map found in AsyncStorage');
//         }
//       } catch (error) {
//         console.error("loadInitialData: Error loading initial data:", error);
//       }
//     };

//     loadInitialData();
//   }, []);

//   const getCityNameById = async (cityId) => {
//     // Keep the original API call as requested (even though it doesn't work)
//     try {
//       const response = await fetch(
//         `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${cityId}}`
//       );
//       const data = await response.json();

//       if (data.success && data.result && data.result.records) {
//         const record = data.result.records.find(r => r._id.toString() === cityId.toString());
//         if (record && record['city_name_en']) {
//           const fetchedCityName = record['city_name_en'];
//           setCitiesMap(prev => ({ ...prev, [cityId]: fetchedCityName }));
//           return fetchedCityName;
//         }
//       }
//       return null;
//     } catch (error) {
//       console.error('getCityNameById: Error fetching city from gov API:', error);
//       return null;
//     }
//   };


//   // Fetch event details
//   useEffect(() => {
//     const fetchEventDetails = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         // If no token, user is a guest, but we still fetch event details
//         const headers = token ? { Authorization: `Bearer ${token}` } : {};

//         const response = await fetch(`${apiUrl}/api/Events/${eventId}`, {
//           headers,
//         });

//         if (!response.ok) {
//           throw new Error('Failed to fetch event details');
//         }

//         const result = await response.json();
//         console.log('fetchEventDetails: API response:', result);
//         if (result.success) {
//           const cityName = await getCityNameById(result.data.cityId);
//           setEvent({ ...result.data, cityName });
//         } else {
//           throw new Error('Failed to load event data');
//         }
//       } catch (err) {
//         setError(err.message);
//         console.error('fetchEventDetails: Error fetching event details:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchEventDetails();
//   }, [eventId]);

//   // Handle spectator registration
//   const handleSpectatorRegistration = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       const response = await fetch(`${apiUrl}/api/Events/${eventId}/register-spectator`, {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (response.ok) {
//         setIsSpectator(true);
//         console.log('handleSpectatorRegistration: Successfully registered as spectator');
//       } else {
//         console.error('handleSpectatorRegistration: Failed to register as spectator');
//       }
//     } catch (error) {
//       console.error('handleSpectatorRegistration: Error registering as spectator:', error);
//     }
//   };

//   // Handle request to join as player
//   const handleRequestToJoin = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       const response = await fetch(`${apiUrl}/api/Events/${eventId}/request-join`, {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (response.ok) {
//         setIsPlayerRequested(true);
//         console.log('handleRequestToJoin: Successfully requested to join as player');
//       } else {
//         console.error('handleRequestToJoin: Failed to request to join as player');
//       }
//     } catch (error) {
//       console.error('handleRequestToJoin: Error requesting to join as player:', error);
//     }
//   };

//   // Handle cancel registration
//   const handleCancelRegistration = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       const response = await fetch(`${apiUrl}/api/Events/${eventId}/cancel-registration`, {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (response.ok) {
//         setIsPlayerRequested(false);
//         console.log('handleCancelRegistration: Successfully canceled registration');
//       } else {
//         console.error('handleCancelRegistration: Failed to cancel registration');
//       }
//     } catch (error) {
//       console.error('handleCancelRegistration: Error canceling registration:', error);
//     }
//   };

//   // Handle add to calendar
//   const handleAddToCalendar = () => {
//     console.log('handleAddToCalendar: Add to calendar functionality not implemented');
//   };

//   if (loading) {
//     return (
//       <View className="flex-1 justify-center items-center bg-white">
//         <ActivityIndicator size="large" color="#10B981" />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View className="flex-1 justify-center items-center p-4 bg-white">
//         <Text className="text-red-500 mb-4">{error}</Text>
//         <TouchableOpacity
//           className="bg-gray-200 px-4 py-2 rounded-full"
//           onPress={() => router.back()}
//         >
//           <Text className="text-gray-800 font-medium">Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   if (!event) {
//     return (
//       <View className="flex-1 justify-center items-center bg-white">
//         <Text className="text-gray-500">Event not found</Text>
//         <TouchableOpacity
//           className="bg-gray-200 px-4 py-2 rounded-full mt-4"
//           onPress={() => router.back()}
//         >
//           <Text className="text-gray-800 font-medium">Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   // Determine event type
//   const sportName = sportsMap[event.sportId]?.toLowerCase();
//   const isFootballOrBasketball = sportName === 'football' || sportName === 'basketball';
//   const isMarathon = sportName === 'marathon';

//   console.log('EventDetails: Conditions:', {
//     sportName,
//     isFootballOrBasketball,
//     isMarathon,
//     isLoggedIn,
//     isPlayerRequested,
//     isSpectator,
//   });

//   // Base event details UI (used for both guest and logged-in users)
//   const renderEventDetails = () => (
//     <>
//       <View className="flex-row justify-between items-center mb-4">
//         <Text className="text-2xl font-bold text-gray-900">{event.eventName}</Text>
//         <Image
//           source={{ uri: `${apiUrl}/Images/${event.profileImage}` }}
//           className="w-12 h-12 rounded-full"
//         />
//       </View>

//       <View className="flex-row justify-between mb-2">
//         <Text className="text-sm font-bold text-gray-900">Sport: {sportsMap[event.sportId]}</Text>
//         <Text className="text-sm font-bold text-gray-900">City: {event.cityName || 'Unknown'}</Text>
//       </View>

//       <View className="flex-row justify-between mb-2">
//         <Text className="text-sm font-bold text-gray-900">
//           StartDate: {new Date(event.startDatetime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}, {new Date(event.startDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//         </Text>
//         <Text className="text-sm font-bold text-gray-900">
//           EndDate: {new Date(event.endDatetime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
//         </Text>
//       </View>

//       <View className="flex-row justify-between mb-2">
//         <Text className="text-sm font-bold text-gray-900">Status: {event.status}</Text>
//         <Text className="text-sm font-bold text-gray-900">{event.locationName}</Text>
//       </View>

//       <View className="flex-row justify-between mb-2">
//         <Text className="text-sm font-bold text-gray-900">Gender: {event.gender}</Text>
//         <Text className="text-sm font-bold text-gray-900">
//           {isMarathon ? "Max Participants Number" : "Max Teams Number"}: {event.maxTeams || '∞'}
//         </Text>
//       </View>

//       <View className="flex-row justify-between mb-2">
//         <Text className="text-sm font-bold text-gray-900">
//           {isMarathon ? "Total Participants" : "Total Teams"}: {event.teamsNum}
//         </Text>
//         <Text className="text-sm font-bold text-gray-900">Winner: {event.winner || 'N/A'}</Text>
//       </View>

//       <Text className="text-sm font-bold text-gray-900 mb-2">Description:</Text>
//       <Text className="text-sm text-gray-700 mb-4">{event.description}</Text>

//       <View className="flex-row justify-center mb-4">
//         <Ionicons name="location" size={24} color="red" />
//       </View>
//     </>
//   );

//   // Guest (not logged in): Show event details with only "Go Back" button
//   if (!isLoggedIn) {
//     console.log('Rendering Guest Screen: Not logged in');
//     return (
//       <ScrollView className="flex-1 bg-white p-4">
//         {renderEventDetails()}
//         <TouchableOpacity
//           className="bg-gray-200 py-3 rounded-lg items-center mb-4"
//           onPress={() => router.back()}
//         >
//           <Text className="text-gray-800 font-bold text-lg">Go Back</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     );
//   }

//   // Logged-in user: Apply existing button conditions
//   // Screen 1: Football/Basketball
//   if (isFootballOrBasketball && !isPlayerRequested) {
//     console.log('Rendering Screen 1: Football/Basketball');
//     return (
//       <ScrollView className="flex-1 bg-white p-4">
//         {renderEventDetails()}
//         <TouchableOpacity
//           className="bg-green-500 py-3 rounded-lg items-center mb-4"
//           onPress={handleSpectatorRegistration}
//         >
//           <Text className="text-white font-bold text-lg">
//             {isSpectator ? "Registered As Spectator" : "Register As Spectator"}
//           </Text>
//         </TouchableOpacity>
//       </ScrollView>
//     );
//   }

//   // Screen 3: Marathon (before requesting to join)
//   if (isMarathon && !isPlayerRequested) {
//     console.log('Rendering Screen 3: Marathon (before requesting to join)');
//     return (
//       <ScrollView className="flex-1 bg-white p-4">
//         {renderEventDetails()}
//         <TouchableOpacity
//           className="bg-green-500 py-3 rounded-lg items-center mb-4"
//           onPress={handleRequestToJoin}
//         >
//           <Text className="text-white font-bold text-lg">Request To Join As A Player</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           className="bg-green-500 py-3 rounded-lg items-center mb-4"
//           onPress={handleSpectatorRegistration}
//         >
//           <Text className="text-white font-bold text-lg">
//             {isSpectator ? "Registered As Spectator" : "Register As Spectator"}
//           </Text>
//         </TouchableOpacity>
//       </ScrollView>
//     );
//   }

//   // Screen 4: Marathon (after requesting to join)
//   if (isMarathon && isPlayerRequested) {
//     console.log('Rendering Screen 4: Marathon (after requesting to join)');
//     return (
//       <ScrollView className="flex-1 bg-white p-4">
//         {renderEventDetails()}
//         <TouchableOpacity
//           className="bg-green-500 py-3 rounded-lg items-center mb-4"
//           onPress={handleCancelRegistration}
//         >
//           <Text className="text-white font-bold text-lg">Cancel Registration</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           className="bg-green-500 py-3 rounded-lg items-center mb-4"
//           onPress={handleAddToCalendar}
//         >
//           <Text className="text-white font-bold text-lg">Add to the calendar</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     );
//   }

//   // Default screen for logged-in users (if none of the conditions match)
//   console.log('Rendering Default Screen: Logged in');
//   return (
//     <ScrollView className="flex-1 bg-white p-4">
//       {renderEventDetails()}
//       <TouchableOpacity
//         className="bg-gray-200 py-3 rounded-lg items-center mb-4"
//         onPress={() => router.back()}
//       >
//         <Text className="text-gray-800 font-bold text-lg">Go Back</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }




////////////////////////////////////////////////////////////////////////////////////////////////////alaa descard



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
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Ionicons } from '@expo/vector-icons';
// import getApiBaseUrl from '../config/apiConfig';

// const apiUrl = getApiBaseUrl();

// export default function EventDetails() {
//   const router = useRouter();
//   const { eventId } = useLocalSearchParams();

//   // State
//   const [event, setEvent] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [citiesMap, setCitiesMap] = useState({});
//   const [sportsMap, setSportsMap] = useState({});
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [joinPolicyModalVisible, setJoinPolicyModalVisible] = useState(false);
//   const [joinPolicy, setJoinPolicy] = useState(event?.isPublic ? 'Public' : 'Private');
//   const [notificationMessage, setNotificationMessage] = useState('');
//   const [editEventModalVisible, setEditEventModalVisible] = useState(false);
//   const [addGroupSearch, setAddGroupSearch] = useState('');
//   const [addGroupResults, setAddGroupResults] = useState([]);

//   // Dummy data for admin sections
//   const dummyEventGroups = [
//     { id: 1, name: 'Alpha Team', groupImage: 'https://example.com/alpha.png' },
//     { id: 2, name: 'Beta Squad', groupImage: 'https://example.com/beta.png' },
//   ];

//   // Load sports map & login
//   useEffect(() => {
//     (async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         setIsLoggedIn(!!token);
//         const stored = await AsyncStorage.getItem('sportsMap');
//         if (stored) setSportsMap(JSON.parse(stored));
//       } catch (e) {
//         console.error(e);
//       }
//     })();
//   }, []);

//   // Fetch city name
//   const getCityNameById = async (id) => {
//     try {
//       const resp = await fetch(
//         `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${id}}`
//       );
//       const json = await resp.json();
//       if (json.success && json.result.records.length) {
//         const name = json.result.records[0]['city_name_en'];
//         setCitiesMap(m => ({ ...m, [id]: name }));
//         return name;
//       }
//     } catch (e) {
//       console.error(e);
//     }
//     return null;
//   };

//   // Fetch event details
//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         const token = await AsyncStorage.getItem('token');
//         const headers = token ? { Authorization: `Bearer ${token}` } : {};
//         const resp = await fetch(`${apiUrl}/api/Events/${eventId}`, { headers });
//         if (!resp.ok) throw new Error('Failed to fetch event details');
//         const { success, data } = await resp.json();
//         if (!success) throw new Error('Failed to load event data');
//         const cityName = await getCityNameById(data.cityId);
//         setEvent({ ...data, cityName });
//       } catch (e) {
//         console.error(e);
//         setError(e.message);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [eventId]);

//   const confirm = (title, msg, onOk) =>
//     Alert.alert(title, msg, [
//       { text: 'Cancel', style: 'cancel' },
//       { text: 'OK', onPress: onOk }
//     ]);

//   // Handlers
//   const handleAddToCalendar = () => console.log('Add to calendar');
//   const handleRegisterSpectator = () => console.log('Join as spectator');
//   const handleCancelSpectator = () => console.log('Cancel spectator');
//   const handleRequestPlayer = () => console.log('Request to join as player');
//   const handleCancelPlayer = () => console.log('Cancel player join');

//   // Admin handlers
//   const handleEditJoinPolicy = () => setJoinPolicyModalVisible(true);
//   const handleSaveJoinPolicy = () => setJoinPolicyModalVisible(false);
//   const handleSendNotification = () => { console.log('Notify:', notificationMessage); setNotificationMessage(''); };
//   const handleEditEvent = () => setEditEventModalVisible(true);
//   const handleSaveEvent = () => setEditEventModalVisible(false);
//   const handleSearchGroups = () => setAddGroupResults(dummyEventGroups);
//   const handleAddGroup = (g) => console.log('Add group', g);
//   const handleRemoveGroup = (g) => confirm('Remove Group', `Remove ${g.name}?`, () => console.log('Removed', g));

//   if (loading) return (
//     <View className="flex-1 justify-center items-center bg-white">
//       <ActivityIndicator size="large" color="#10B981" />
//     </View>
//   );
//   if (error) return (
//     <View className="flex-1 justify-center items-center p-4 bg-white">
//       <Text className="text-red-500 mb-4">{error}</Text>
//       <TouchableOpacity onPress={() => router.back()} className="bg-gray-200 px-4 py-2 rounded-full">
//         <Text className="text-gray-800 font-medium">Go Back</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   // Destructure flags
//   const {
//     requiresTeams,
//     isGroupParticipant,
//     isParticipant,
//     playWatch,
//     isAdmin,
//   } = event;

//   // Base details render
//   const renderDetails = () => (
//     <>
//       <View className="flex-row justify-between items-center mb-4">
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={28} color="#333" />
//         </TouchableOpacity>
//         <Text className="text-2xl font-bold text-gray-900">{event.eventName}</Text>
//         <Image
//           source={{ uri: `${apiUrl}/Images/${event.eventImage}` }}
//           className="w-12 h-12 rounded-full"
//         />
//       </View>
//       <View className="flex-row justify-between mb-2">
//         <Text className="text-base text-gray-900">Sport: {sportsMap[event.sportId]}</Text>
//         <Text className="text-base text-gray-900">City: {event.cityName || 'Unknown'}</Text>
//       </View>
//       <View className="flex-row justify-between mb-2">
//         <Text className="text-base text-gray-900">
//           {new Date(event.startDatetime).toLocaleString()}
//         </Text>
//         <Text className="text-base text-gray-900">
//           {new Date(event.endDatetime).toLocaleDateString()}
//         </Text>
//       </View>
//       <View className="flex-row justify-between mb-2">
//         <Text className="text-base text-gray-900">Location: {event.locationName}</Text>
//         <TouchableOpacity>
//           <Ionicons name="location" size={24} color="red" />
//         </TouchableOpacity>
//       </View>
//       <Text className="text-base text-gray-700 mb-4">{event.description}</Text>
//     </>
//   );

//   // Not logged in
//   if (!isLoggedIn) {
//     return (
//       <ScrollView className="p-4 bg-white">
//         {renderDetails()}
//       </ScrollView>
//     );
//   }

//   // Admin view
//   if (isAdmin) {
//     return (
//       <ScrollView className="p-4 bg-white">
//         {renderDetails()}

//         {/* <TouchableOpacity
//           onPress={handleEditJoinPolicy}
//           className="bg-green-500 py-3 rounded-lg mb-4"
//         >
//           <Text className="text-white text-center font-bold">Edit Join Policy</Text>
//         </TouchableOpacity> */}

//         <Text className="text-lg font-bold mb-2">Event Groups</Text>
//         {dummyEventGroups.map(g => (
//           <View key={g.id} className="flex-row justify-between items-center mb-2">
//             <View className="flex-row items-center">
//               <Image source={{ uri: g.groupImage }} className="w-8 h-8 rounded-full mr-2" />
//               <Text className="text-base text-gray-700">{g.name}</Text>
//             </View>
//             <TouchableOpacity onPress={() => handleRemoveGroup(g)}>
//               <Ionicons name="trash" size={20} color="#E53E3E" />
//             </TouchableOpacity>
//           </View>
//         ))}

//         <TextInput
//           className="border border-gray-300 rounded-lg p-2 mb-2"
//           placeholder="Notification message..."
//           value={notificationMessage}
//           onChangeText={setNotificationMessage}
//           multiline
//         />
//         <TouchableOpacity
//           onPress={handleSendNotification}
//           disabled={!notificationMessage.trim()}
//           className={`bg-green-500 py-3 rounded-lg mb-4 ${!notificationMessage.trim() && 'opacity-50'}`}
//         >
//           <Text className="text-white text-center font-bold">Send Notification</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={handleEditEvent}
//           className="bg-blue-500 py-3 rounded-lg mb-4"
//         >
//           <Text className="text-white text-center font-bold">Edit Event</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={handleAddToCalendar}
//           className="bg-gray-200 py-3 rounded-lg mb-4"
//         >
//           <Text className="text-gray-800 text-center font-bold">Add to Calendar</Text>
//         </TouchableOpacity>

//         <Text className="text-lg font-bold mb-2">Add Group</Text>
//         <TextInput
//           className="border border-gray-300 rounded-lg p-2 mb-2"
//           placeholder="Search groups..."
//           value={addGroupSearch}
//           onChangeText={setAddGroupSearch}
//         />
//         <TouchableOpacity
//           onPress={handleSearchGroups}
//           className="bg-green-500 py-2 rounded-lg mb-2"
//         >
//           <Text className="text-white text-center">Search</Text>
//         </TouchableOpacity>
//         {addGroupResults.map(g => (
//           <View key={g.id} className="flex-row justify-between items-center mb-2">
//             <View className="flex-row items-center">
//               <Image source={{ uri: g.groupImage }} className="w-8 h-8 rounded-full mr-2" />
//               <Text className="text-base text-gray-700">{g.name}</Text>
//             </View>
//             <TouchableOpacity onPress={() => handleAddGroup(g)} className="bg-blue-500 py-1 px-3 rounded-lg">
//               <Text className="text-white">Add</Text>
//             </TouchableOpacity>
//           </View>
//         ))}

//         {/* Modals omitted for brevity */}
//       </ScrollView>
//     );
//   }

//   // Logged-in, non-admin
//   return (
//     <ScrollView className="p-4 bg-white">
//       {renderDetails()}

//       {requiresTeams ? (
//         isGroupParticipant ? (
//           <TouchableOpacity
//             onPress={handleAddToCalendar}
//             className="bg-green-500 py-3 rounded-lg mb-4"
//           >
//             <Text className="text-white text-center font-bold">You are signed — Add to Calendar</Text>
//           </TouchableOpacity>
//         ) : isParticipant ? (
//           !playWatch ? (
//             <TouchableOpacity
//               onPress={handleCancelSpectator}
//               className="bg-red-500 py-3 rounded-lg mb-4"
//             >
//               <Text className="text-white text-center font-bold">Cancel Spectator</Text>
//             </TouchableOpacity>
//           ) : null
//         ) : (
//           <TouchableOpacity
//             onPress={handleRegisterSpectator}
//             className="bg-green-500 py-3 rounded-lg mb-4"
//           >
//             <Text className="text-white text-center font-bold">Join as Spectator</Text>
//           </TouchableOpacity>
//         )
//       ) : (
//         !isParticipant && !playWatch ? (
//           <>
//             <TouchableOpacity
//               onPress={handleRequestPlayer}
//               className="bg-green-500 py-3 rounded-lg mb-2"
//             >
//               <Text className="text-white text-center font-bold">Request to Join as Player</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={handleRegisterSpectator}
//               className="bg-green-500 py-3 rounded-lg mb-4"
//             >
//               <Text className="text-white text-center font-bold">Join as Spectator</Text>
//             </TouchableOpacity>
//           </>
//         ) : isParticipant && !playWatch ? (
//           <TouchableOpacity
//             onPress={handleCancelSpectator}
//             className="bg-red-500 py-3 rounded-lg mb-4"
//           >
//             <Text className="text-white text-center font-bold">Cancel Spectator</Text>
//           </TouchableOpacity>
//         ) : isParticipant && playWatch ? (
//           <TouchableOpacity
//             onPress={handleCancelPlayer}
//             className="bg-red-500 py-3 rounded-lg mb-4"
//           >
//             <Text className="text-white text-center font-bold">Cancel Player Join</Text>
//           </TouchableOpacity>
//         ) : null
//       )}

//       <TouchableOpacity
//         onPress={() => router.back()}
//         className="bg-gray-200 py-3 rounded-lg items-center"
//       >
//         <Text className="text-gray-800 font-bold text-lg">Go Back</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }


////////////////////////////////////////////////////////////////////////////////////////////////// alaa code apove


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
//   FlatList,
// } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Ionicons } from '@expo/vector-icons';
// import getApiBaseUrl from '../config/apiConfig';

// const apiUrl = getApiBaseUrl();

// export default function EventDetails() {
//   const router = useRouter();
//   const { eventId } = useLocalSearchParams();

//   // State
//   const [event, setEvent] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [citiesMap, setCitiesMap] = useState({});
//   const [sportsMap, setSportsMap] = useState({});
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [joinPolicyModalVisible, setJoinPolicyModalVisible] = useState(false);
//   const [joinPolicy, setJoinPolicy] = useState(event?.isPublic ? 'Public' : 'Private');
//   const [notificationMessage, setNotificationMessage] = useState('');
//   const [editEventModalVisible, setEditEventModalVisible] = useState(false);
//   const [addGroupSearch, setAddGroupSearch] = useState('');
//   const [addGroupResults, setAddGroupResults] = useState([]);
//   const [page, setPage] = useState(1);
//   const [isLoadingGroups, setIsLoadingGroups] = useState(false);
//   const [hasMoreGroups, setHasMoreGroups] = useState(true);

//   // Dummy data for admin sections
//   const dummyEventGroups = [
//     { id: 1, name: 'Alpha Team', groupImage: 'https://example.com/alpha.png' },
//     { id: 2, name: 'Beta Squad', groupImage: 'https://example.com/beta.png' },
//   ];

//   // Load sports map & login
//   useEffect(() => {
//     (async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         setIsLoggedIn(!!token);
//         const stored = await AsyncStorage.getItem('sportsMap');
//         if (stored) setSportsMap(JSON.parse(stored));
//       } catch (e) {
//         console.error(e);
//       }
//     })();
//   }, []);

//   // Fetch city name
//   const getCityNameById = async (id) => {
//     try {
//       const resp = await fetch(
//         `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${id}}`
//       );
//       const json = await resp.json();
//       if (json.success && json.result.records.length) {
//         const name = json.result.records[0]['city_name_en'];
//         setCitiesMap(m => ({ ...m, [id]: name }));
//         return name;
//       }
//     } catch (e) {
//       console.error(e);
//     }
//     return null;
//   };

//   // Fetch event details
//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         const token = await AsyncStorage.getItem('token');
//         const headers = token ? { Authorization: `Bearer ${token}` } : {};
//         const resp = await fetch(`${apiUrl}/api/Events/${eventId}`, { headers });
//         if (!resp.ok) throw new Error('Failed to fetch event details');
//         const { success, data } = await resp.json();
//         if (!success) throw new Error('Failed to load event data');
//         const cityName = await getCityNameById(data.cityId);
//         setEvent({
//           ...data,
//           cityName,
//           members: data.members, // Add these if your API provides them
//           minAge: data.minAge,
//           gender: data.gender,
//           matches: data.matches,
//           wins: data.wins,
//           losses: data.losses,
//         });
//       } catch (e) {
//         console.error(e);
//         setError(e.message);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [eventId]);

//   const confirm = (title, msg, onOk) =>
//     Alert.alert(title, msg, [
//       { text: 'Cancel', style: 'cancel' },
//       { text: 'OK', onPress: onOk }
//     ]);

//   // Handlers
//   const handleAddToCalendar = () => console.log('Add to calendar');
//   const handleRegisterSpectator = () => console.log('Join as spectator');
//   const handleCancelSpectator = () => console.log('Cancel spectator');
//   const handleRequestPlayer = () => console.log('Request to join as player');
//   const handleCancelPlayer = () => console.log('Cancel player join');

//   // Admin handlers
//   const handleEditJoinPolicy = () => setJoinPolicyModalVisible(true);
//   const handleSaveJoinPolicy = () => setJoinPolicyModalVisible(false);
//   const handleSendNotification = () => { console.log('Notify:', notificationMessage); setNotificationMessage(''); };
//   const handleEditEvent = () => setEditEventModalVisible(true);
//   const handleSaveEvent = () => setEditEventModalVisible(false);
//   const handleAddGroup = (g) => console.log('Add group', g);
//   const handleRemoveGroup = (g) => confirm('Remove Group', `Remove ${g.name}?`, () => console.log('Removed', g));

//   const handleSearchGroups = async (reset = false) => {
//     if (isLoadingGroups || (!hasMoreGroups && !reset) || !addGroupSearch.trim()) return;

//     setIsLoadingGroups(true);
//     const currentPage = reset ? 1 : page;

//     try {
//       const token = await AsyncStorage.getItem('token');
//       const query = `?type=group&name=${encodeURIComponent(addGroupSearch)}&page=${currentPage}&pageSize=10`;
//       const endpoint = `${apiUrl}/api/Search${query}`;

//       const response = await fetch(endpoint, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch groups: ${response.status}`);
//       }

//       const result = await response.json();
//       if (!result.success) {
//         throw new Error('API returned success: false');
//       }

//       const groups = result.data.map(group => ({
//         id: group.groupId || group.id,
//         name: group.groupName || group.name || 'Unnamed Group',
//         groupImage: `${apiUrl}/Images/${group.groupImage || 'default_group.png'}`,
//       }));

//       if (reset) {
//         setAddGroupResults(groups);
//         setPage(2);
//       } else {
//         setAddGroupResults(prev => [...prev, ...groups]);
//         setPage(currentPage + 1);
//       }
//       setHasMoreGroups(result.pagination?.hasMore ?? groups.length === 10);
//     } catch (error) {
//       console.error('Error fetching groups:', error);
//       Alert.alert('Error', 'Failed to load groups');
//       setAddGroupResults([]);
//     } finally {
//       setIsLoadingGroups(false);
//     }
//   };

//   const handleGroupDetails = (groupId) => {
//     router.push({
//       pathname: '/screens/GroupDetails',
//       params: { groupId: groupId }
//     });
//   };

//   const handleLoadMore = () => {
//     if (!isLoadingGroups && hasMoreGroups && addGroupSearch.trim()) {
//       handleSearchGroups();
//     }
//   };

//   if (loading) return (
//     <View className="flex-1 justify-center items-center bg-white">
//       <ActivityIndicator size="large" color="#10B981" />
//     </View>
//   );
//   if (error) return (
//     <View className="flex-1 justify-center items-center p-4 bg-white">
//       <Text className="text-red-500 mb-4">{error}</Text>
//       <TouchableOpacity onPress={() => router.back()} className="bg-gray-200 px-4 py-2 rounded-full">
//         <Text className="text-gray-800 font-medium">Go Back</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   // Destructure flags
//   const {
//     requiresTeams,
//     isGroupParticipant,
//     isParticipant,
//     playWatch,
//     isAdmin,
//   } = event;

//   // Base details render
//   const renderDetails = () => (
//     <>
//       <View className="flex-row justify-between items-center mb-4">
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={28} color="#65DA84" />
//         </TouchableOpacity>
//         <View className="flex-1 items-center">
//           <Text className="text-2xl font-bold text-gray-900">{event.eventName}</Text>
//         </View>
//         <Image
//           source={{ uri: `${apiUrl}/Images/${event.eventImage}` }}
//           className="w-12 h-12 rounded-full"
//         />
//       </View>

//       {/* Card for Details */}
//       <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
//         <Text className="text-lg font-semibold text-gray-900 mb-2">Details</Text>
//         <Text className="text-base text-gray-700 mb-4">{event.description}</Text>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">Sport</Text>
//           <Text className="text-base text-gray-900">{sportsMap[event.sportId]}</Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">City</Text>
//           <Text className="text-base text-gray-900">{event.cityName || 'Unknown'}</Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">Date</Text>
//           <Text className="text-base text-gray-900">
//             {new Date(event.startDatetime).toLocaleDateString()} {new Date(event.startDatetime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
//           </Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">End Date</Text>
//           <Text className="text-base text-gray-900">
//             {new Date(event.endDatetime).toLocaleDateString()} {new Date(event.endDatetime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
//           </Text>
//         </View>

//         {/* Additional fields from screenshot */}
//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">Members</Text>
//           <Text className="text-base text-gray-900">{event.members || 'N/A'}</Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">Min Age</Text>
//           <Text className="text-base text-gray-900">{event.minAge || 'N/A'}</Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">Gender</Text>
//           <Text className="text-base text-gray-900">{event.gender || 'N/A'}</Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">Matches</Text>
//           <Text className="text-base text-gray-900">{event.matches || 0}</Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">W / L</Text>
//           <Text className="text-base text-gray-900">{event.wins || 0}/{event.losses || 0}</Text>
//         </View>

//         {/* Centered Location */}
//         <View className="items-center mb-4">
//           <View className="flex-row items-center">
//             <Ionicons name="location" size={24} color="red" />
//             <Text className="text-base text-gray-900 ml-2">{event.locationName}</Text>
//           </View>
//         </View>
//       </View>
//     </>
//   );

//   // Not logged in
//   if (!isLoggedIn) {
//     return (
//       <ScrollView className="p-4 bg-gray-100">
//         {renderDetails()}
//       </ScrollView>
//     );
//   }

//   // Admin view
// if (isAdmin) {
//   return (
//     <ScrollView className="p-4 bg-gray-100">
//       {renderDetails()}
//       <TouchableOpacity
//         onPress={handleAddToCalendar}
//         className="bg-green-400 py-3 rounded-lg mb-4"
//       >
//         <Text className="text-white text-center font-bold">Add to Calendar</Text>
//       </TouchableOpacity>

//       <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
//         <Text className="text-lg font-semibold text-gray-900 mb-2">Event Groups</Text>
//         {dummyEventGroups.map(g => (
//           <View key={g.id} className="flex-row justify-between items-center mb-2">
//             <View className="flex-row items-center">
//               <Image source={{ uri: g.groupImage }} className="w-8 h-8 rounded-full mr-2" />
//               <Text className="text-base text-gray-700">{g.name}</Text>
//             </View>
//             <TouchableOpacity onPress={() => handleRemoveGroup(g)}>
//               <Ionicons name="trash" size={20} color="#E53E3E" />
//             </TouchableOpacity>
//           </View>
//         ))}
//       </View>

//       {/* Moved Add Group section here */}
//      <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
//      <Text className="text-lg font-bold mb-2">Add Group</Text>
//       <TextInput
//         className="border border-gray-300 rounded-lg p-2 mb-2"
//         placeholder="Search groups..."
//         value={addGroupSearch}
//         onChangeText={(text) => {
//           setAddGroupSearch(text);
//           if (text.trim()) {
//             handleSearchGroups(true);
//           } else {
//             setAddGroupResults([]);
//             setPage(1);
//             setHasMoreGroups(true);
//           }
//         }}
//       />
//             <FlatList
//         data={addGroupResults || []}
//         keyExtractor={(item, index) => 
//           item.id ? item.id.toString() : `fallback-${index}`
//         }
//         renderItem={({ item }) => (
//           <View className="flex-row justify-between items-center mb-2">
//             <View className="flex-row items-center">
//               <Image 
//                 source={{ uri: item.groupImage || 'https://via.placeholder.com/150' }} 
//                 className="w-8 h-8 rounded-full mr-2" 
//               />
//               <Text className="text-base text-gray-700">{item.name}</Text>
//             </View>
//             <View className="flex-row">
//               <TouchableOpacity 
//                 onPress={() => handleGroupDetails(item.id)}
//                 className="bg-gray-500 py-1 px-3 rounded-lg mr-2"
//               >
//                 <Text className="text-white">Details</Text>
//               </TouchableOpacity>
//               <TouchableOpacity 
//                 onPress={() => handleAddGroup(item)} 
//                 className="bg-blue-500 py-1 px-3 rounded-lg"
//               >
//                 <Text className="text-white">Add</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}
//         onEndReached={handleLoadMore}
//         onEndReachedThreshold={0.1}
//         ListFooterComponent={
//           isLoadingGroups ? (
//             <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 10 }} />
//           ) : null
//         }
//       />
//      </View>


//         <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
//           <TextInput
//           className="border border-gray-300 rounded-lg p-2 mb-2"
//           placeholder="Notification message..."
//           value={notificationMessage}
//           onChangeText={setNotificationMessage}
//           multiline
//         />
//         <TouchableOpacity
//           onPress={handleSendNotification}
//           disabled={!notificationMessage.trim()}
//           className={`bg-green-500 py-3 rounded-lg mb-4 ${!notificationMessage.trim() && 'opacity-50'}`}
//         >
//           <Text className="text-white text-center font-bold">Send Notification</Text>
//         </TouchableOpacity>
//         </View>

//       {/* Edit Event and Add to Calendar buttons moved below */}
//       <TouchableOpacity
//         onPress={handleEditEvent}
//         className="bg-blue-500 py-3 rounded-lg mb-4"
//       >
//         <Text className="text-white text-center font-bold">Edit Event</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

//   // Logged-in, non-admin
//   return (
//     <ScrollView className="p-4 bg-gray-100">
//       {renderDetails()}

//       {requiresTeams ? (
//         isGroupParticipant ? (
//           <TouchableOpacity
//             onPress={handleAddToCalendar}
//             className="bg-green-500 py-3 rounded-lg mb-4"
//           >
//             <Text className="text-white text-center font-bold">You are signed — Add to Calendar</Text>
//           </TouchableOpacity>
//         ) : isParticipant ? (
//           !playWatch ? (
//             <TouchableOpacity
//               onPress={handleCancelSpectator}
//               className="bg-red-500 py-3 rounded-lg mb-4"
//             >
//               <Text className="text-white text-center font-bold">Cancel Spectator</Text>
//             </TouchableOpacity>
//           ) : null
//         ) : (
//           <TouchableOpacity
//             onPress={handleRegisterSpectator}
//             className="bg-green-500 py-3 rounded-lg mb-4"
//           >
//             <Text className="text-white text-center font-bold">Join as Spectator</Text>
//           </TouchableOpacity>
//         )
//       ) : (
//         !isParticipant && !playWatch ? (
//           <>
//             <TouchableOpacity
//               onPress={handleRequestPlayer}
//               className="bg-green-500 py-3 rounded-lg mb-2"
//             >
//               <Text className="text-white text-center font-bold">Request to Join as Player</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={handleRegisterSpectator}
//               className="bg-green-500 py-3 rounded-lg mb-4"
//             >
//               <Text className="text-white text-center font-bold">Join as Spectator</Text>
//             </TouchableOpacity>
//           </>
//         ) : isParticipant && !playWatch ? (
//           <TouchableOpacity
//             onPress={handleCancelSpectator}
//             className="bg-red-500 py-3 rounded-lg mb-4"
//           >
//             <Text className="text-white text-center font-bold">Cancel Spectator</Text>
//           </TouchableOpacity>
//         ) : isParticipant && playWatch ? (
//           <TouchableOpacity
//             onPress={handleCancelPlayer}
//             className="bg-red-500 py-3 rounded-lg mb-4"
//           >
//             <Text className="text-white text-center font-bold">Cancel Player Join</Text>
//           </TouchableOpacity>
//         ) : null
//       )}

//       <TouchableOpacity
//         onPress={() => router.back()}
//         className="bg-gray-200 py-3 rounded-lg items-center"
//       >
//         <Text className="text-gray-800 font-bold text-lg">Go Back</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }








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
//   FlatList,
// } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Ionicons } from '@expo/vector-icons';
// import getApiBaseUrl from '../config/apiConfig';

// const apiUrl = getApiBaseUrl();
// const PAGE_SIZE = 3; // Same page size as GroupDetails for consistency

// export default function EventDetails() {
//   const router = useRouter();
//   const { eventId } = useLocalSearchParams();

//   // State
//   const [event, setEvent] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [citiesMap, setCitiesMap] = useState({});
//   const [sportsMap, setSportsMap] = useState({});
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [joinPolicyModalVisible, setJoinPolicyModalVisible] = useState(false);
//   const [joinPolicy, setJoinPolicy] = useState(event?.isPublic ? 'Public' : 'Private');
//   const [notificationMessage, setNotificationMessage] = useState('');
//   const [editEventModalVisible, setEditEventModalVisible] = useState(false);
//   const [addGroupSearch, setAddGroupSearch] = useState('');
//   const [addGroupResults, setAddGroupResults] = useState([]);
//   const [page, setPage] = useState(1);
//   const [isLoadingGroups, setIsLoadingGroups] = useState(false);
//   const [hasMoreGroups, setHasMoreGroups] = useState(true);

//   // Marathon Members pagination state (new)
//   const [marathonMembers, setMarathonMembers] = useState([]);
//   const [marathonMembersPage, setMarathonMembersPage] = useState(1);
//   const [marathonMembersHasMore, setMarathonMembersHasMore] = useState(false);
//   const [marathonMembersDisplayCount, setMarathonMembersDisplayCount] = useState(PAGE_SIZE);
//   const isMarathonMembersExpanded = marathonMembersDisplayCount > PAGE_SIZE;

//   // Dummy data for admin sections
//   const dummyEventGroups = [
//     { id: 1, name: 'Alpha Team', groupImage: 'https://example.com/alpha.png' },
//     { id: 2, name: 'Beta Squad', groupImage: 'https://example.com/beta.png' },
//   ];

//   // Load sports map & login
//   useEffect(() => {
//     (async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         setIsLoggedIn(!!token);
//         const stored = await AsyncStorage.getItem('sportsMap');
//         if (stored) setSportsMap(JSON.parse(stored));
//       } catch (e) {
//         console.error(e);
//       }
//     })();
//   }, []);

//   // Fetch city name
//   const getCityNameById = async (id) => {
//     try {
//       const resp = await fetch(
//         `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${id}}`
//       );
//       const json = await resp.json();
//       if (json.success && json.result.records.length) {
//         const name = json.result.records[0]['city_name_en'];
//         setCitiesMap(m => ({ ...m, [id]: name }));
//         return name;
//       }
//     } catch (e) {
//       console.error(e);
//     }
//     return null;
//   };

//   // Fetch event details
//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         const token = await AsyncStorage.getItem('token');
//         const headers = token ? { Authorization: `Bearer ${token}` } : {};
//         const resp = await fetch(`${apiUrl}/api/Events/${eventId}`, { headers });
//         if (!resp.ok) throw new Error('Failed to fetch event details');
//         const { success, data } = await resp.json();
//         if (!success) throw new Error('Failed to load event data');
//         const cityName = await getCityNameById(data.cityId);
//         setEvent({
//           ...data,
//           cityName,
//           members: data.members,
//           minAge: data.minAge,
//           gender: data.gender,
//           matches: data.matches,
//           wins: data.wins,
//           losses: data.losses,
//         });
//         // Reset pagination for marathon members
//         setMarathonMembers([]);
//         setMarathonMembersPage(1);
//         setMarathonMembersDisplayCount(PAGE_SIZE);
//       } catch (e) {
//         console.error(e);
//         setError(e.message);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [eventId]);

//   // Fetch marathon members (for admin, when event is a marathon)
//   useEffect(() => {
//     if (!event || !event.isAdmin || event.requiresTeams) return; // Only fetch if admin and marathon
//     (async () => {
//       const token = await AsyncStorage.getItem('token');
//       try {
//         const resp = await fetch(
//           `${apiUrl}/api/Events/${event.eventId}/participants?page=${marathonMembersPage}&pageSize=${PAGE_SIZE}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const json = await resp.json();
//         if (json.success) {
//           setMarathonMembers((prev) => (marathonMembersPage === 1 ? json.data : [...prev, ...json.data]));
//           setMarathonMembersHasMore(json.pagination?.hasMore || false);
//         }
//       } catch (e) {
//         console.error('Failed to load marathon members', e);
//       }
//     })();
//   }, [event, marathonMembersPage]);

//   const confirm = (title, msg, onOk) =>
//     Alert.alert(title, msg, [
//       { text: 'Cancel', style: 'cancel' },
//       { text: 'OK', onPress: onOk }
//     ]);

//   // Handlers
//   const handleAddToCalendar = () => console.log('Add to calendar');
//   const handleRegisterSpectator = () => console.log('Join as spectator');
//   const handleCancelSpectator = () => console.log('Cancel spectator');
//   const handleRequestPlayer = () => console.log('Request to join as player');
//   const handleCancelPlayer = () => console.log('Cancel player join');

//   // Admin handlers
//   const handleEditJoinPolicy = () => setJoinPolicyModalVisible(true);
//   const handleSaveJoinPolicy = () => setJoinPolicyModalVisible(false);
//   const handleSendNotification = () => { console.log('Notify:', notificationMessage); setNotificationMessage(''); };
//   const handleEditEvent = () => setEditEventModalVisible(true);
//   const handleSaveEvent = () => setEditEventModalVisible(false);
//   const handleAddGroup = (g) => console.log('Add group', g);
//   const handleRemoveGroup = (g) => confirm('Remove Group', `Remove ${g.name}?`, () => console.log('Removed', g));

//   // Marathon members handler
//   const handleToggleMarathonMembers = () => {
//     if (marathonMembersHasMore) {
//       // Load next page
//       setMarathonMembersPage(p => p + 1);
//       setMarathonMembersDisplayCount(c => c + PAGE_SIZE);
//     } else if (isMarathonMembersExpanded) {
//       // Hide: reset to first page
//       setMarathonMembersPage(1);
//       setMarathonMembersDisplayCount(PAGE_SIZE);
//     }
//   };

//   const handleSearchGroups = async (reset = false) => {
//     if (isLoadingGroups || (!hasMoreGroups && !reset) || !addGroupSearch.trim()) return;

//     setIsLoadingGroups(true);
//     const currentPage = reset ? 1 : page;

//     try {
//       const token = await AsyncStorage.getItem('token');
//       const query = `?type=group&name=${encodeURIComponent(addGroupSearch)}&page=${currentPage}&pageSize=10`;
//       const endpoint = `${apiUrl}/api/Search${query}`;

//       const response = await fetch(endpoint, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch groups: ${response.status}`);
//       }

//       const result = await response.json();
//       if (!result.success) {
//         throw new Error('API returned success: false');
//       }

//       const groups = result.data.map(group => ({
//         id: group.groupId || group.id,
//         name: group.groupName || group.name || 'Unnamed Group',
//         groupImage: `${apiUrl}/Images/${group.groupImage || 'default_group.png'}`,
//       }));

//       if (reset) {
//         setAddGroupResults(groups);
//         setPage(2);
//       } else {
//         setAddGroupResults(prev => [...prev, ...groups]);
//         setPage(currentPage + 1);
//       }
//       setHasMoreGroups(result.pagination?.hasMore ?? groups.length === 10);
//     } catch (error) {
//       console.error('Error fetching groups:', error);
//       Alert.alert('Error', 'Failed to load groups');
//       setAddGroupResults([]);
//     } finally {
//       setIsLoadingGroups(false);
//     }
//   };

//   const handleGroupDetails = (groupId) => {
//     router.push({
//       pathname: '/screens/GroupDetails',
//       params: { groupId: groupId }
//     });
//   };

//   const handleLoadMore = () => {
//     if (!isLoadingGroups && hasMoreGroups && addGroupSearch.trim()) {
//       handleSearchGroups();
//     }
//   };

//   if (loading) return (
//     <View className="flex-1 justify-center items-center bg-white">
//       <ActivityIndicator size="large" color="#10B981" />
//     </View>
//   );
//   if (error) return (
//     <View className="flex-1 justify-center items-center p-4 bg-white">
//       <Text className="text-red-500 mb-4">{error}</Text>
//       <TouchableOpacity onPress={() => router.back()} className="bg-gray-200 px-4 py-2 rounded-full">
//         <Text className="text-gray-800 font-medium">Go Back</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   // Destructure flags
//   const {
//     requiresTeams,
//     isGroupParticipant,
//     isParticipant,
//     playWatch,
//     isAdmin,
//   } = event;

//   // Base details render
//   const renderDetails = () => (
//     <>
//       <View className="flex-row justify-between items-center mb-4">
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={28} color="#333" />
//         </TouchableOpacity>
//         <View className="flex-1 items-center">
//           <Text className="text-2xl font-bold text-gray-900">{event.eventName}</Text>
//         </View>
//         <Image
//           source={{ uri: `${apiUrl}/Images/${event.eventImage}` }}
//           className="w-12 h-12 rounded-full"
//         />
//       </View>

//       {/* Card for Details */}
//       <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
//         <Text className="text-lg font-semibold text-gray-900 mb-2">Details</Text>
//         <Text className="text-base text-gray-700 mb-4">{event.description}</Text>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">Sport</Text>
//           <Text className="text-base text-gray-900">{sportsMap[event.sportId]}</Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">City</Text>
//           <Text className="text-base text-gray-900">{event.cityName || 'Unknown'}</Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">Date</Text>
//           <Text className="text-base text-gray-900">
//             {new Date(event.startDatetime).toLocaleDateString()} {new Date(event.startDatetime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
//           </Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">End Date</Text>
//           <Text className="text-base text-gray-900">
//             {new Date(event.endDatetime).toLocaleDateString()} {new Date(event.endDatetime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
//           </Text>
//         </View>

//         {/* Additional fields from screenshot */}
//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">Members</Text>
//           <Text className="text-base text-gray-900">{event.members || 'N/A'}</Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">Min Age</Text>
//           <Text className="text-base text-gray-900">{event.minAge || 'N/A'}</Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">Gender</Text>
//           <Text className="text-base text-gray-900">{event.gender || 'N/A'}</Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">Matches</Text>
//           <Text className="text-base text-gray-900">{event.matches || 0}</Text>
//         </View>

//         <View className="flex-row justify-between mb-2">
//           <Text className="text-base text-gray-900 font-medium">W / L</Text>
//           <Text className="text-base text-gray-900">{event.wins || 0}/{event.losses || 0}</Text>
//         </View>

//         {/* Centered Location */}
//         <View className="items-center mb-4">
//           <View className="flex-row items-center">
//             <Ionicons name="location" size={24} color="red" />
//             <Text className="text-base text-gray-900 ml-2">{event.locationName}</Text>
//           </View>
//         </View>
//       </View>
//     </>
//   );

//   // Not logged in
//   if (!isLoggedIn) {
//     return (
//       <ScrollView className="p-4 bg-gray-100">
//         {renderDetails()}
//       </ScrollView>
//     );
//   }

//   // Admin view
//   if (isLoggedIn && isAdmin) {
//     return (
//       <ScrollView className="p-4 bg-gray-100">
//         {renderDetails()}

//         {/* Conditionally render Event Groups or Marathon Members */}
//         {requiresTeams ? (
//           // Event Groups for team-based events
//           <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
//             <Text className="text-lg font-semibold text-gray-900 mb-2">Event Groups</Text>
//             {dummyEventGroups.map(g => (
//               <View key={g.id} className="flex-row justify-between items-center mb-2">
//                 <View className="flex-row items-center">
//                   <Image source={{ uri: g.groupImage }} className="w-8 h-8 rounded-full mr-2" />
//                   <Text className="text-base text-gray-700">{g.name}</Text>
//                 </View>
//                 <TouchableOpacity onPress={() => handleRemoveGroup(g)}>
//                   <Ionicons name="trash" size={20} color="#E53E3E" />
//                 </TouchableOpacity>
//               </View>
//             ))}
//           </View>
//         ) : (
//           // Marathon Members for marathon events
//           <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
//             <Text className="text-lg font-semibold text-gray-900 mb-2">Marathon Members</Text>
//             {marathonMembers.length === 0 ? (
//               <Text className="text-gray-600">There are no participants in this marathon.</Text>
//             ) : (
//               marathonMembers.slice(0, marathonMembersDisplayCount).map((m) => (
//                 <View key={m.userId} className="flex-row justify-between items-center py-3 border-b border-gray-200">
//                   <View className="flex-row items-center space-x-3">
//                     <Image
//                       source={{ uri: `${apiUrl}/Images/${m.participantImage || 'default_user.png'}` }}
//                       className="w-10 h-10 rounded-full"
//                     />
//                     <View>
//                       <Text className="text-gray-800 text-base font-medium">{m.participantName || 'Unknown'}</Text>
//                       <Text className="text-gray-500 text-sm">Joined on {new Date(m.joinDate).toLocaleDateString('en-CA')}</Text>
//                     </View>
//                   </View>
//                 </View>
//               ))
//             )}
//             {(marathonMembersDisplayCount > PAGE_SIZE || marathonMembersHasMore) && (
//               <TouchableOpacity onPress={handleToggleMarathonMembers} className="mt-2 py-2">
//                 <Text className="text-blue-600 text-center">
//                   {marathonMembersHasMore ? 'Show More' : (isMarathonMembersExpanded ? 'Hide' : 'Show More')}
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         )}

//         <TextInput
//           className="border border-gray-300 rounded-lg p-2 mb-2"
//           placeholder="Notification message..."
//           value={notificationMessage}
//           onChangeText={setNotificationMessage}
//           multiline
//         />
//         <TouchableOpacity
//           onPress={handleSendNotification}
//           disabled={!notificationMessage.trim()}
//           className={`bg-green-500 py-3 rounded-lg mb-4 ${!notificationMessage.trim() && 'opacity-50'}`}
//         >
//           <Text className="text-white text-center font-bold">Send Notification</Text>
//         </TouchableOpacity>

//         <Text className="text-lg font-bold mb-2">Add Group</Text>
//         <TextInput
//           className="border border-gray-300 rounded-lg p-2 mb-2"
//           placeholder="Search groups..."
//           value={addGroupSearch}
//           onChangeText={(text) => {
//             setAddGroupSearch(text);
//             if (text.trim()) {
//               handleSearchGroups(true);
//             } else {
//               setAddGroupResults([]);
//               setPage(1);
//               setHasMoreGroups(true);
//             }
//           }}
//         />
//         <FlatList
//           data={addGroupResults || []}
//           keyExtractor={(item, index) => 
//             item.id ? item.id.toString() : `fallback-${index}`
//           }
//           renderItem={({ item }) => (
//             <View className="flex-row justify-between items-center mb-2">
//               <View className="flex-row items-center">
//                 <Image 
//                   source={{ uri: item.groupImage || 'https://via.placeholder.com/150' }} 
//                   className="w-8 h-8 rounded-full mr-2" 
//                 />
//                 <Text className="text-base text-gray-700">{item.name}</Text>
//               </View>
//               <View className="flex-row">
//                 <TouchableOpacity 
//                   onPress={() => handleGroupDetails(item.id)}
//                   className="bg-gray-500 py-1 px-3 rounded-lg mr-2"
//                 >
//                   <Text className="text-white">Details</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity 
//                   onPress={() => handleAddGroup(item)} 
//                   className="bg-blue-500 py-1 px-3 rounded-lg"
//                 >
//                   <Text className="text-white">Add</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           )}
//           onEndReached={handleLoadMore}
//           onEndReachedThreshold={0.1}
//           ListFooterComponent={
//             isLoadingGroups ? (
//               <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 10 }} />
//             ) : null
//           }
//         />

//         <TouchableOpacity
//           onPress={handleEditEvent}
//           className="bg-blue-500 py-3 rounded-lg mb-4"
//         >
//           <Text className="text-white text-center font-bold">Edit Event</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={handleAddToCalendar}
//           className="bg-gray-200 py-3 rounded-lg mb-4"
//         >
//           <Text className="text-gray-800 text-center font-bold">Add to Calendar</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     );
//   }

//   // Logged-in, non-admin
//   return (
//     <ScrollView className="p-4 bg-gray-100">
//       {renderDetails()}

//       {requiresTeams ? (
//         isGroupParticipant ? (
//           <TouchableOpacity
//             onPress={handleAddToCalendar}
//             className="bg-green-500 py-3 rounded-lg mb-4"
//           >
//             <Text className="text-white text-center font-bold">You are signed — Add to Calendar</Text>
//           </TouchableOpacity>
//         ) : isParticipant ? (
//           !playWatch ? (
//             <TouchableOpacity
//               onPress={handleCancelSpectator}
//               className="bg-red-500 py-3 rounded-lg mb-4"
//             >
//               <Text className="text-white text-center font-bold">Cancel Spectator</Text>
//             </TouchableOpacity>
//           ) : null
//         ) : (
//           <TouchableOpacity
//             onPress={handleRegisterSpectator}
//             className="bg-green-500 py-3 rounded-lg mb-4"
//           >
//             <Text className="text-white text-center font-bold">Join as Spectator</Text>
//           </TouchableOpacity>
//         )
//       ) : (
//         !isParticipant && !playWatch ? (
//           <>
//             <TouchableOpacity
//               onPress={handleRequestPlayer}
//               className="bg-green-500 py-3 rounded-lg mb-2"
//             >
//               <Text className="text-white text-center font-bold">Request to Join as Player</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={handleRegisterSpectator}
//               className="bg-green-500 py-3 rounded-lg mb-4"
//             >
//               <Text className="text-white text-center font-bold">Join as Spectator</Text>
//             </TouchableOpacity>
//           </>
//         ) : isParticipant && !playWatch ? (
//           <TouchableOpacity
//             onPress={handleCancelSpectator}
//             className="bg-red-500 py-3 rounded-lg mb-4"
//           >
//             <Text className="text-white text-center font-bold">Cancel Spectator</Text>
//           </TouchableOpacity>
//         ) : isParticipant && playWatch ? (
//           <TouchableOpacity
//             onPress={handleCancelPlayer}
//             className="bg-red-500 py-3 rounded-lg mb-4"
//           >
//             <Text className="text-white text-center font-bold">Cancel Player Join</Text>
//           </TouchableOpacity>
//         ) : null
//       )}

//       <TouchableOpacity
//         onPress={() => router.back()}
//         className="bg-gray-200 py-3 rounded-lg items-center"
//       >
//         <Text className="text-gray-800 font-bold text-lg">Go Back</Text>
//       </TouchableOpacity>
//     </ScrollView>
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import getApiBaseUrl from '../config/apiConfig';

const apiUrl = getApiBaseUrl();
const PAGE_SIZE = 3; // Same page size as GroupDetails for consistency

export default function EventDetails() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams();

  // State
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [citiesMap, setCitiesMap] = useState({});
  const [sportsMap, setSportsMap] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [joinPolicyModalVisible, setJoinPolicyModalVisible] = useState(false);
  const [joinPolicy, setJoinPolicy] = useState(event?.isPublic ? 'Public' : 'Private');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [editEventModalVisible, setEditEventModalVisible] = useState(false);

  // Event Members pagination state (previously Marathon Members)
  const [eventMembers, setEventMembers] = useState([]);
  const [eventMembersPage, setEventMembersPage] = useState(1);
  const [eventMembersHasMore, setEventMembersHasMore] = useState(false);
  const [eventMembersDisplayCount, setEventMembersDisplayCount] = useState(PAGE_SIZE);
  const isEventMembersExpanded = eventMembersDisplayCount > PAGE_SIZE;

  // Join Requests pagination state (new)
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinRequestsPage, setJoinRequestsPage] = useState(1);
  const [joinRequestsHasMore, setJoinRequestsHasMore] = useState(false);
  const [joinRequestsDisplayCount, setJoinRequestsDisplayCount] = useState(PAGE_SIZE);
  const isJoinRequestsExpanded = joinRequestsDisplayCount > PAGE_SIZE;

  // Modal state for member details
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Dummy data for admin sections
  const dummyEventGroups = [
    { id: 1, name: 'Alpha Team', groupImage: 'https://example.com/alpha.png' },
    { id: 2, name: 'Beta Squad', groupImage: 'https://example.com/beta.png' },
  ];

  // Dummy data for Event Members
  const dummyEventMembers = [
    {
      userId: 1,
      participantName: 'John Doe',
      participantImage: 'https://example.com/john.png',
      joinDate: '2025-01-15T00:00:00',
      bio: 'Avid runner with 5 years of marathon experience.',
      email: 'john.doe@example.com',
      age: 30,
      cityName: 'Tel Aviv',
      gender: 'M',
    },
    {
      userId: 2,
      participantName: 'Jane Smith',
      participantImage: 'https://example.com/jane.png',
      joinDate: '2025-02-20T00:00:00',
      bio: 'First-time marathon runner, loves challenges.',
      email: 'jane.smith@example.com',
      age: 28,
      cityName: 'Haifa',
      gender: 'F',
    },
    {
      userId: 3,
      participantName: 'Alex Brown',
      participantImage: 'https://example.com/alex.png',
      joinDate: '2025-03-10T00:00:00',
      bio: 'Professional athlete specializing in long-distance running.',
      email: 'alex.brown@example.com',
      age: 35,
      cityName: 'Jerusalem',
      gender: 'M',
    },
  ];

  // Dummy data for Join Requests
  const dummyJoinRequests = [
    {
      requestId: 1,
      userId: 4,
      fullName: 'Sarah Wilson',
      userPicture: 'https://example.com/sarah.png',
      requestDate: '2025-04-01T00:00:00',
      bio: 'Enthusiastic runner looking to join marathons.',
      email: 'sarah.wilson@example.com',
      age: 27,
      cityName: 'Eilat',
      gender: 'F',
    },
    {
      requestId: 2,
      userId: 5,
      fullName: 'Mike Johnson',
      userPicture: 'https://example.com/mike.png',
      requestDate: '2025-04-05T00:00:00',
      bio: 'Experienced marathoner seeking new events.',
      email: 'mike.johnson@example.com',
      age: 32,
      cityName: 'Beer Sheva',
      gender: 'M',
    },
  ];

  // Load sports map & login
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setIsLoggedIn(!!token);
        const stored = await AsyncStorage.getItem('sportsMap');
        if (stored) setSportsMap(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Fetch city name
  const getCityNameById = async (id) => {
    try {
      const resp = await fetch(
        `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${id}}`
      );
      const json = await resp.json();
      if (json.success && json.result.records.length) {
        const name = json.result.records[0]['city_name_en'];
        setCitiesMap(m => ({ ...m, [id]: name }));
        return name;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // Fetch event details
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await fetch(`${apiUrl}/api/Events/${eventId}`, { headers });
        if (!resp.ok) throw new Error('Failed to fetch event details');
        const { success, data } = await resp.json();
        if (!success) throw new Error('Failed to load event data');
        const cityName = await getCityNameById(data.cityId);
        setEvent({
          ...data,
          cityName,
          members: data.members,
          minAge: data.minAge,
          gender: data.gender,
          matches: data.matches,
          wins: data.wins,
          losses: data.losses,
        });
        // Reset pagination for event members and join requests
        setEventMembers(dummyEventMembers);
        setEventMembersPage(1);
        setEventMembersDisplayCount(PAGE_SIZE);
        setEventMembersHasMore(dummyEventMembers.length > PAGE_SIZE);
        setJoinRequests(dummyJoinRequests);
        setJoinRequestsPage(1);
        setJoinRequestsDisplayCount(PAGE_SIZE);
        setJoinRequestsHasMore(dummyJoinRequests.length > PAGE_SIZE);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const confirm = (title, msg, onOk) =>
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: onOk }
    ]);

  // Handlers
  const handleAddToCalendar = () => console.log('Add to calendar');
  const handleRegisterSpectator = () => console.log('Join as spectator');
  const handleCancelSpectator = () => console.log('Cancel spectator');
  const handleRequestPlayer = () => console.log('Request to join as player');
  const handleCancelPlayer = () => console.log('Cancel player join');

  // Admin handlers
  const handleEditJoinPolicy = () => setJoinPolicyModalVisible(true);
  const handleSaveJoinPolicy = () => setJoinPolicyModalVisible(false);
  const handleSendNotification = () => { console.log('Notify:', notificationMessage); setNotificationMessage(''); };
  const handleEditEvent = () => setEditEventModalVisible(true);
  const handleSaveEvent = () => setEditEventModalVisible(false);
  const handleRemoveGroup = (g) => confirm('Remove Group', `Remove ${g.name}?`, () => console.log('Removed', g));

  // Event Members handler
  const handleToggleEventMembers = () => {
    if (eventMembersHasMore) {
      setEventMembersPage(p => p + 1);
      setEventMembersDisplayCount(c => c + PAGE_SIZE);
    } else if (isEventMembersExpanded) {
      setEventMembersPage(1);
      setEventMembersDisplayCount(PAGE_SIZE);
    }
  };

  const handleShowMemberDetails = (member) => {
    setSelectedUser({
      fullName: member.participantName,
      bio: member.bio,
      email: member.email,
      age: member.age,
      cityName: member.cityName,
      gender: member.gender,
    });
    setUserModalVisible(true);
  };

  // Join Requests handlers
  const handleToggleJoinRequests = () => {
    if (joinRequestsHasMore) {
      setJoinRequestsPage(p => p + 1);
      setJoinRequestsDisplayCount(c => c + PAGE_SIZE);
    } else if (isJoinRequestsExpanded) {
      setJoinRequestsPage(1);
      setJoinRequestsDisplayCount(PAGE_SIZE);
    }
  };

  const handleShowRequestUserDetails = (req) => {
    setSelectedUser({
      fullName: req.fullName,
      bio: req.bio,
      email: req.email,
      age: req.age,
      cityName: req.cityName,
      gender: req.gender,
    });
    setUserModalVisible(true);
  };

  const handleAcceptRequest = (req) => {
    setJoinRequests(requests => requests.filter(r => r.requestId !== req.requestId));
    Alert.alert('Accepted', `${req.fullName}'s request has been accepted.`);
  };

  const handleRejectRequest = (req) => {
    setJoinRequests(requests => requests.filter(r => r.requestId !== req.requestId));
    Alert.alert('Rejected', `${req.fullName}'s request has been rejected.`);
  };

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
  if (error) return (
    <View className="flex-1 justify-center items-center p-4 bg-white">
      <Text className="text-red-500 mb-4">{error}</Text>
      <TouchableOpacity onPress={() => router.back()} className="bg-gray-200 px-4 py-2 rounded-full">
        <Text className="text-gray-800 font-medium">Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Destructure flags
  const {
    requiresTeams,
    isGroupParticipant,
    isParticipant,
    playWatch,
    isAdmin,
  } = event;

  // Base details render
  const renderDetails = () => (
    <>
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-gray-900">{event.eventName}</Text>
        </View>
        <Image
          source={{ uri: `${apiUrl}/Images/${event.eventImage}` }}
          className="w-12 h-12 rounded-full"
        />
      </View>

      {/* Card for Details */}
      <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Details</Text>
        <Text className="text-base text-gray-700 mb-4">{event.description}</Text>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">Sport</Text>
          <Text className="text-base text-gray-900">{sportsMap[event.sportId]}</Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">City</Text>
          <Text className="text-base text-gray-900">{event.cityName || 'Unknown'}</Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">Date</Text>
          <Text className="text-base text-gray-900">
            {new Date(event.startDatetime).toLocaleDateString()} {new Date(event.startDatetime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">End Date</Text>
          <Text className="text-base text-gray-900">
            {new Date(event.endDatetime).toLocaleDateString()} {new Date(event.endDatetime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">Members</Text>
          <Text className="text-base text-gray-900">{event.members || 'N/A'}</Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">Min Age</Text>
          <Text className="text-base text-gray-900">{event.minAge || 'N/A'}</Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">Gender</Text>
          <Text className="text-base text-gray-900">{event.gender || 'N/A'}</Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">Matches</Text>
          <Text className="text-base text-gray-900">{event.matches || 0}</Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">W / L</Text>
          <Text className="text-base text-gray-900">{event.wins || 0}/{event.losses || 0}</Text>
        </View>

        <View className="items-center mb-4">
          <View className="flex-row items-center">
            <Ionicons name="location" size={24} color="red" />
            <Text className="text-base text-gray-900 ml-2">{event.locationName}</Text>
          </View>
        </View>
      </View>
    </>
  );

  // Not logged in
  if (!isLoggedIn) {
    return (
      <ScrollView className="p-4 bg-gray-100">
        {renderDetails()}
      </ScrollView>
    );
  }

  // Admin view
  if (isLoggedIn && isAdmin) {
    return (
      <View className="flex-1 bg-gray-100">
        <ScrollView className="p-4">
          {renderDetails()}

          {/* Conditionally render Event Groups or Event Members */}
          {requiresTeams ? (
            // Event Groups for team-based events
            <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Event Groups</Text>
              {dummyEventGroups.map(g => (
                <View key={g.id} className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center">
                    <Image source={{ uri: g.groupImage }} className="w-8 h-8 rounded-full mr-2" />
                    <Text className="text-base text-gray-700">{g.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveGroup(g)}>
                    <Ionicons name="trash" size={20} color="#E53E3E" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            // Event Members for marathon events
            <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Event Members</Text>
              {eventMembers.length === 0 ? (
                <Text className="text-gray-600">There are no participants in this event.</Text>
              ) : (
                eventMembers.slice(0, eventMembersDisplayCount).map((m) => (
                  <View key={m.userId} className="flex-row justify-between items-center py-3 border-b border-gray-200">
                    <View className="flex-row items-center space-x-3">
                      <Image
                        source={{ uri: m.participantImage || 'https://via.placeholder.com/150' }}
                        className="w-10 h-10 rounded-full"
                      />
                      <View>
                        <Text className="text-gray-800 text-base font-medium">{m.participantName || 'Unknown'}</Text>
                        <Text className="text-gray-500 text-sm">Joined on {new Date(m.joinDate).toLocaleDateString('en-CA')}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleShowMemberDetails(m)}>
                      <Text className="text-blue-600 border border-blue-600 px-4 py-1 rounded-full">Details</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
              {(eventMembersDisplayCount > PAGE_SIZE || eventMembersHasMore) && (
                <TouchableOpacity onPress={handleToggleEventMembers} className="mt-2 py-2">
                  <Text className="text-blue-600 text-center">
                    {eventMembersHasMore ? 'Show More' : (isEventMembersExpanded ? 'Hide' : 'Show More')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TextInput
            className="border border-gray-300 rounded-lg p-2 mb-2"
            placeholder="Notification message..."
            value={notificationMessage}
            onChangeText={setNotificationMessage}
            multiline
          />
          <TouchableOpacity
            onPress={handleSendNotification}
            disabled={!notificationMessage.trim()}
            className={`bg-green-500 py-3 rounded-lg mb-4 ${!notificationMessage.trim() && 'opacity-50'}`}
          >
            <Text className="text-white text-center font-bold">Send Notification</Text>
          </TouchableOpacity>

          {/* Join Requests for marathon events */}
          {!requiresTeams && (
            <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Join Requests</Text>
              {joinRequests.length === 0 ? (
                <Text className="text-gray-600">There are no pending join requests.</Text>
              ) : (
                joinRequests.slice(0, joinRequestsDisplayCount).map((r) => (
                  <View key={r.requestId} className="flex-row justify-between items-center py-2">
                    <View className="w-12 h-12 rounded-full bg-green-300 justify-center items-center">
                      <Image
                        source={{ uri: r.userPicture || 'https://via.placeholder.com/150' }}
                        className="w-10 h-10 rounded-full"
                      />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-gray-700 text-lg">{r.fullName}</Text>
                      <Text className="text-gray-500 text-sm">{new Date(r.requestDate).toLocaleDateString('en-CA')}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleShowRequestUserDetails(r)}>
                      <Text className="text-blue-600 border border-blue-600 px-4 py-1 rounded-full">Details</Text>
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
              {(joinRequestsDisplayCount > PAGE_SIZE || joinRequestsHasMore) && (
                <TouchableOpacity onPress={handleToggleJoinRequests} className="mt-2 py-2">
                  <Text className="text-blue-600 text-center">
                    {joinRequestsHasMore ? 'Show More' : (isJoinRequestsExpanded ? 'Hide' : 'Show More')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            onPress={handleEditEvent}
            className="bg-blue-500 py-3 rounded-lg mb-4"
          >
            <Text className="text-white text-center font-bold">Edit Event</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAddToCalendar}
            className="bg-gray-200 py-3 rounded-lg mb-4"
          >
            <Text className="text-gray-800 text-center font-bold">Add to Calendar</Text>
          </TouchableOpacity>
        </ScrollView>

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
      </View>
    );
  }

  // Logged-in, non-admin
  return (
    <ScrollView className="p-4 bg-gray-100">
      {renderDetails()}

      {requiresTeams ? (
        isGroupParticipant ? (
          <TouchableOpacity
            onPress={handleAddToCalendar}
            className="bg-green-500 py-3 rounded-lg mb-4"
          >
            <Text className="text-white text-center font-bold">You are signed — Add to Calendar</Text>
          </TouchableOpacity>
        ) : isParticipant ? (
          !playWatch ? (
            <TouchableOpacity
              onPress={handleCancelSpectator}
              className="bg-red-500 py-3 rounded-lg mb-4"
            >
              <Text className="text-white text-center font-bold">Cancel Spectator</Text>
            </TouchableOpacity>
          ) : null
        ) : (
          <TouchableOpacity
            onPress={handleRegisterSpectator}
            className="bg-green-500 py-3 rounded-lg mb-4"
          >
            <Text className="text-white text-center font-bold">Join as Spectator</Text>
          </TouchableOpacity>
        )
      ) : (
        !isParticipant && !playWatch ? (
          <>
            <TouchableOpacity
              onPress={handleRequestPlayer}
              className="bg-green-500 py-3 rounded-lg mb-2"
            >
              <Text className="text-white text-center font-bold">Request to Join as Player</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRegisterSpectator}
              className="bg-green-500 py-3 rounded-lg mb-4"
            >
              <Text className="text-white text-center font-bold">Join as Spectator</Text>
            </TouchableOpacity>
          </>
        ) : isParticipant && !playWatch ? (
          <TouchableOpacity
            onPress={handleCancelSpectator}
            className="bg-red-500 py-3 rounded-lg mb-4"
          >
            <Text className="text-white text-center font-bold">Cancel Spectator</Text>
          </TouchableOpacity>
        ) : isParticipant && playWatch ? (
          <TouchableOpacity
            onPress={handleCancelPlayer}
            className="bg-red-500 py-3 rounded-lg mb-4"
          >
            <Text className="text-white text-center font-bold">Cancel Player Join</Text>
          </TouchableOpacity>
        ) : null
      )}

      <TouchableOpacity
        onPress={() => router.back()}
        className="bg-gray-200 py-3 rounded-lg items-center"
      >
        <Text className="text-gray-800 font-bold text-lg">Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}