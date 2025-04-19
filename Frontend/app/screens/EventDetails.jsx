import { useState, useEffect } from 'react';
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
  FlatList,
  Platform,
  Linking
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import getApiBaseUrl from '../config/apiConfig';
import * as Calendar from 'expo-calendar';

const apiUrl = getApiBaseUrl();
const PAGE_SIZE = 5;

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
  const [userProfile, setUserProfile] = useState(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [isPlayerRequestPending, setIsPlayerRequestPending] = useState(false);
  const [winnerName, setWinnerName] = useState(null);

  // Add Group state
  const [addGroupSearch, setAddGroupSearch] = useState('');
  const [addGroupResults, setAddGroupResults] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [hasMoreGroups, setHasMoreGroups] = useState(true);

  // Event Members pagination state
  const [eventMembers, setEventMembers] = useState([]);
  const [eventMembersPage, setEventMembersPage] = useState(1);
  const [eventMembersHasMore, setEventMembersHasMore] = useState(false);
  const [eventMembersDisplayCount, setEventMembersDisplayCount] = useState(PAGE_SIZE);
  const isEventMembersExpanded = eventMembersDisplayCount > PAGE_SIZE;

  // Join Requests pagination state
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinRequestsPage, setJoinRequestsPage] = useState(1);
  const [joinRequestsHasMore, setJoinRequestsHasMore] = useState(false);
  const [joinRequestsDisplayCount, setJoinRequestsDisplayCount] = useState(PAGE_SIZE);
  const isJoinRequestsExpanded = joinRequestsDisplayCount > PAGE_SIZE;

  // Modal state for user details
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [calendarId, setCalendarId] = useState(null);

  // Load sports map, login, user profile, and persisted event state
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setIsLoggedIn(!!token);
        const storedSports = await AsyncStorage.getItem('sportsMap');
        if (storedSports) setSportsMap(JSON.parse(storedSports));

        // Load persisted event state
        const storedEventState = await AsyncStorage.getItem(`event_${eventId}`);
        if (storedEventState) {
          const { isParticipant, isPlayerRequestPending, isSpectator } = JSON.parse(storedEventState);
          setEvent(prev => (prev ? { ...prev, isParticipant } : null));
          setIsPlayerRequestPending(isPlayerRequestPending || false);
          setIsSpectator(isSpectator || false);
        }

        if (token) {
          const headers = { Authorization: `Bearer ${token}` };
          const resp = await fetch(`${apiUrl}/api/Users/GetUserProfile`, { headers });
          if (!resp.ok) throw new Error('Failed to fetch user profile');
          const userData = await resp.json();
          setUserProfile(userData);
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to load user profile');
      }
    })();
  }, [eventId]);


  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        const [token, storedSports, storedEventState, userId] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('sportsMap'),
          AsyncStorage.getItem(`event_${eventId}`),
          AsyncStorage.getItem('userId'),
        ]);

        setIsLoggedIn(!!token);
        if (storedSports) setSportsMap(JSON.parse(storedSports));
        if (storedEventState) {
          const { isParticipant, isPlayerRequestPending, isSpectator } = JSON.parse(storedEventState);
          setEvent(prev => (prev ? { ...prev, isParticipant } : null));
          setIsPlayerRequestPending(isPlayerRequestPending || false);
          setIsSpectator(isSpectator || false);
        }

        if (token && userId) {
          const headers = { Authorization: `Bearer ${token}` };
          const resp = await fetch(`${apiUrl}/api/Users/GetUserProfile`, { headers });
          if (!resp.ok) throw new Error('Failed to fetch user profile');
          const userData = await resp.json();
          setUserProfile(userData);
        }
      } catch (e) {
        console.error('Failed to load initial data:', e);
        Alert.alert('Error', 'Failed to load initial data');
      }
    })();
  }, [eventId]);

  // Request permissions and get a default calendar
  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        // Pick owner-level calendar or first available
        const defaultCal = calendars.find(cal => cal.accessLevel === Calendar.CalendarAccessLevel.OWNER)
          || calendars[0];
        setCalendarId(defaultCal.id);
      } else {
        Alert.alert('Permission required', 'Calendar permission is needed to add events.');
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
      console.error('Failed to fetch city name:', e);
    }
    return 'Unknown';
  };

  // Fetch event details and winner name
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await fetch(`${apiUrl}/api/Events/${eventId}`, { headers });
        if (!resp.ok) throw new Error(`Failed to fetch event details: ${resp.status}`);
        const { success, data } = await resp.json();
        if (!success) throw new Error('Failed to load event data');
        const cityName = await getCityNameById(data.cityId);

        // Load persisted state
        const storedEventState = await AsyncStorage.getItem(`event_${eventId}`);
        const persistedState = storedEventState ? JSON.parse(storedEventState) : {};

        setEvent({
          ...data,
          cityName,
          members: data.members,
          minAge: data.minAge,
          gender: data.gender,
          maxParticipants: data.maxParticipants,
          matches: data.matches,
          wins: data.wins,
          losses: data.losses,
          isParticipant: persistedState.isParticipant ?? data.isParticipant,
          requiresTeams: data.requiresTeams,
          isAdmin: data.isAdmin,
          winnerId: data.winnerId,
        });

        // Fetch winner name if winnerId exists
        if (data.winnerId) {
          try {
            const winnerResp = await fetch(
              `${apiUrl}/api/EventParticipants/events/${eventId}/player/${data.winnerId}`,
              { headers }
            );
            if (winnerResp.ok) {
              const winnerData = await winnerResp.json();
              if (winnerData.success && winnerData.user && winnerData.user.fullName) {
                setWinnerName(winnerData.user.fullName);
              } else {
                console.warn('Winner data missing fullName:', winnerData);
              }
            } else {
              console.error('Failed to fetch winner:', winnerResp.status);
            }
          } catch (e) {
            console.error('Error fetching winner name:', e);
          }
        } else {
          setWinnerName(null);
        }

        setIsPlayerRequestPending(persistedState.isPlayerRequestPending ?? false);
        setIsSpectator(persistedState.isSpectator ?? false);
      } catch (e) {
        console.error('Failed to fetch event details:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  // Fetch event members
  useEffect(() => {
    if (!event || !event.isAdmin || event.requiresTeams) return;

    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await fetch(
          `${apiUrl}/api/EventParticipants/${eventId}/players?page=${eventMembersPage}&pageSize=${PAGE_SIZE}`,
          { headers }
        );
        if (!resp.ok) throw new Error(`Failed to fetch event members: ${resp.status}`);
        const { success, data, hasMore } = await resp.json();
        if (!success) throw new Error('Failed to load event members');

        const mappedMembers = data.map(member => ({
          userId: member.userId,
          participantName: member.fullName,
          participantImage: `${apiUrl}/Images/${member.profileImage || 'default_profile.png'}`,
          joinDate: member.joinDate || new Date().toISOString(),
        }));

        setEventMembers(prev => (eventMembersPage === 1 ? mappedMembers : [...prev, ...mappedMembers]));
        setEventMembersHasMore(hasMore || false);
      } catch (e) {
        console.error('Failed to load event members:', e);
        Alert.alert('Error', `Failed to load event members: ${e.message}`);
      }
    })();
  }, [event, eventMembersPage]);

  // Fetch join requests
  const fetchJoinRequests = async (pageNum = 1) => {
    if (!event || !event.isAdmin || event.requiresTeams) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await fetch(
        `${apiUrl}/api/EventParticipants/events/${eventId}/pending-requests?page=${pageNum}&pageSize=${PAGE_SIZE}`,
        { headers }
      );
      if (!resp.ok) throw new Error(`Failed to fetch join requests: ${resp.status}`);
      const response = await resp.json();
      if (!response.success) throw new Error('API returned success: false');

      const mappedRequests = response.requests.map(req => ({
        requestId: req.requestId || req.userId,
        userId: req.userId,
        fullName: req.fullName,
        userPicture: `${apiUrl}/Images/${req.userPicture || 'default_profile.png'}`,
        requestDate: req.requestDate || new Date().toISOString(),
      }));

      setJoinRequests(prev => (pageNum === 1 ? mappedRequests : [...prev, ...mappedRequests]));
      setJoinRequestsHasMore(response.hasMore || false);
      setJoinRequestsPage(pageNum);
      setJoinRequestsDisplayCount(pageNum * PAGE_SIZE);
    } catch (e) {
      console.error('Failed to load join requests:', e);
      Alert.alert('Error', `Failed to load join requests: ${e.message}`);
    }
  };

  useEffect(() => {
    fetchJoinRequests(1);
  }, [event]);

  const confirm = (title, msg, onOk) =>
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: onOk }
    ]);

  //Add to calender handler
  const handleAddToCalendar = async () => {
    if (!calendarId) {
      Alert.alert('No calendar found', 'Unable to locate a calendar to add the event.');
      return;
    }

    try {
      const startDate = new Date(event.startDatetime);
      const endDate = new Date(event.endDatetime); // default duration: 1h

      const createdId = await Calendar.createEventAsync(calendarId, {
        title: event.eventName,
        startDate,
        endDate,
        location: event.locationName,
        timeZone: Calendar.TimeZone || undefined,
      });

      console.log('Event added to calendar, id:', createdId);
      Alert.alert('Success', 'Event added to your calendar!');
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Could not add event to calendar.');
    }
  };

  //handle Location Press
  const handleLocationPress = async () => {
    if (!event?.locationName) {
      Alert.alert('No location', 'Location name is not available.');
      return;
    }

    // Try geo: URI (Android → any maps; iOS → Apple Maps), fallback to Google Maps web
    const geoScheme =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${encodeURIComponent(event.locationName)}`
        : `geo:0,0?q=${encodeURIComponent(event.locationName)}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      event.locationName
    )}`;

    // choose which URL we can open
    const urlToOpen = await Linking.canOpenURL(geoScheme) ? geoScheme : webUrl;

    try {
      await Linking.openURL(urlToOpen);
    } catch (err) {
      console.error('Error opening maps:', err);
      Alert.alert(
        'Cannot open map',
        `Tried to open ${urlToOpen} but failed.`
      );
    }
  };

  const handleRequestPlayer = async () => {
    console.log("test button1", event);
    if (!userProfile || !event) { console.log("faied"); return; }
    const birthDate = new Date(userProfile.birthDate);
    const today = new Date();
    let userAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      userAge--;
    }

    const userGender = userProfile.gender;
    const eventGender = event.gender;
    if (eventGender !== 'Mixed' && eventGender !== userGender) {
      Alert.alert('Not Eligible', `This event is for ${eventGender} participants only.`);
      return;
    }

    if (event.minAge && userAge < event.minAge) {
      Alert.alert('Not Eligible', `You must be at least ${event.minAge} years old to join this event.`);
      return;
    }

    if (event.members >= event.maxParticipants) {
      Alert.alert('Event Full', 'This event has reached its maximum number of participants.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const resp = await fetch(
        `https://localhost:7059/api/EventParticipants/${eventId}/join/true`,
        {
          method: 'POST',
          headers,
        }
      );
      if (!resp.ok) throw new Error('Failed to send join request');
      const result = await resp.json();
      if (!result.success) throw new Error(result.message || 'Failed to send join request');

      setIsPlayerRequestPending(true);

      // Persist the state
      await AsyncStorage.setItem(
        `event_${eventId}`,
        JSON.stringify({
          isParticipant: event.isParticipant,
          isPlayerRequestPending: true,
          isSpectator,
        })
      );

      Alert.alert('Success', 'Your request to join as a player has been sent.');
    } catch (e) {
      console.error('Join request failed', e);
      Alert.alert('Error', e.message || 'Failed to send join request');
    }
  };

  const handleCancelPlayer = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const resp = await fetch(
        `${apiUrl}/api/EventParticipants/${eventId}/cancel-join-request`,
        {
          method: 'POST',
          headers,
        }
      );
      if (!resp.ok) throw new Error(`Failed to cancel join request: ${resp.status}`);
      const result = await resp.json();
      if (!result.success) throw new Error(result.message || 'Failed to cancel join request');

      setIsPlayerRequestPending(false);
      await AsyncStorage.setItem(
        `event_${eventId}`,
        JSON.stringify({
          isParticipant: event.isParticipant,
          isPlayerRequestPending: false,
          isSpectator,
        })
      );
      Alert.alert('Success', 'Your join request has been canceled.');
    } catch (e) {
      console.error('Cancel request failed:', e);
      Alert.alert('Error', e.message || 'Failed to cancel join request');
    }
  };

  const handleJoinSpectator = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const resp = await fetch(
        `https://localhost:7059/api/EventParticipants/${eventId}/join/false`,
        {
          method: 'POST',
          headers,
        }
      );
      if (!resp.ok) throw new Error('Failed to join as spectator');
      const result = await resp.json();
      if (!result.success) throw new Error(result.message || 'Failed to join as spectator');

      setIsSpectator(true);

      // Persist the state
      await AsyncStorage.setItem(
        `event_${eventId}`,
        JSON.stringify({
          isParticipant: event.isParticipant,
          isPlayerRequestPending,
          isSpectator: true,
        })
      );

      Alert.alert('Success', 'You have joined as a spectator.');
    } catch (e) {
      console.error('Join as spectator failed', e);
      Alert.alert('Error', e.message || 'Failed to join as spectator');
    }
  };

  const handleLeaveEvent = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const resp = await fetch(
        `${apiUrl}/api/EventParticipants/${eventId}/leave`,
        {
          method: 'POST',
          headers,
        }
      );
      if (!resp.ok) throw new Error(`Failed to leave event: ${resp.status}`);
      const result = await resp.json();
      if (!result.success) throw new Error(result.message || 'Failed to leave event');

      setEvent(prev => ({
        ...prev,
        isParticipant: false,
      }));
      setIsSpectator(false);
      setIsPlayerRequestPending(false);
      await AsyncStorage.setItem(
        `event_${eventId}`,
        JSON.stringify({
          isParticipant: false,
          isPlayerRequestPending: false,
          isSpectator: false,
        })
      );
      Alert.alert('Success', 'You have left the event.');
    } catch (e) {
      console.error('Leave event failed:', e);
      Alert.alert('Error', e.message || 'Failed to leave event');
    }
  };

  // Admin handlers
  const handleEditEvent = () => console.log('Edit event');
  const handleSendNotification = () => console.log('Send notification');

  // Add Group handlers
  const handleAddGroup = (g) => console.log('Add group', g);
  const handleRemoveGroup = (g) => confirm('Remove Group', `Remove ${g.name}?`, () => console.log('Removed', g));

  // const handleSearchGroups = async (reset = false) => {
  //   if (isLoadingGroups || (!hasMoreGroups && !reset) || !addGroupSearch.trim()) return;

  //   setIsLoadingGroups(true);
  //   const currentPage = reset ? 1 : page;

  //   try {
  //     const token = await AsyncStorage.getItem('token');
  //     const query = `?type=group&name=${encodeURIComponent(addGroupSearch)}&page=${currentPage}&pageSize=10`;
  //     const endpoint = `${apiUrl}/api/Search${query}`;
  //     const response = await fetch(endpoint, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //     });

  //     if (!response.ok) throw new Error(`Failed to fetch groups: ${response.status}`);
  //     const result = await response.json();
  //     if (!result.success) throw new Error('API returned success: false');

  //     const groups = result.data.map(group => ({
  //       id: group.groupId || group.id,
  //       name: group.groupName || group.name || 'Unnamed Group',
  //       groupImage: `${apiUrl}/Images/${group.groupImage || 'default_group.png'}`,
  //     }));

  //     if (reset) {
  //       setAddGroupResults(groups);
  //       setPage(2);
  //     } else {
  //       setAddGroupResults(prev => [...prev, ...groups]);
  //       setPage(currentPage + 1);
  //     }
  //     setHasMoreGroups(result.pagination?.hasMore ?? groups.length === 10);
  //   } catch (error) {
  //     console.error('Error fetching groups:', error);
  //     Alert.alert('Error', 'Failed to load groups');
  //     setAddGroupResults([]);
  //   } finally {
  //     setIsLoadingGroups(false);
  //   }
  // };

  const handleSearchGroups = async (reset = false) => {
    if (isLoadingGroups || (!hasMoreGroups && !reset) || !addGroupSearch.trim()) return;

    setIsLoadingGroups(true);
    const currentPage = reset ? 1 : page;

    try {
      const token = await AsyncStorage.getItem('token');
      // Build the query string in the correct order
      let query = `?type=group`;

      // Add name parameter first, if provided
      if (addGroupSearch.trim()) {
        query += `&name=${encodeURIComponent(addGroupSearch.trim())}`;
      }

      // Add event-specific parameters from the event state
      if (event) {
        if (event.sportId) {
          query += `&sportId=${event.sportId}`;
        }
        if (event.minAge) {
          query += `&minAge=${event.minAge}`;
        }
        if (event.gender) {
          // Ensure gender is lowercase to match API expectation
          query += `&gender=${encodeURIComponent(event.gender.toLowerCase())}`;
        }
      }

      // Add pagination parameters last
      query += `&page=${currentPage}&pageSize=10`;
      console.log(query);
      const endpoint = `${apiUrl}/api/Search${query}`;
      console.log(endpoint);
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch groups: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error('API returned success: false');

      const groups = result.data.map(group => ({
        id: group.groupId || group.id,
        name: group.groupName || group.name || 'Unnamed Group',
        groupImage: `${apiUrl}/Images/${group.groupImage || 'default_group.png'}`,
      }));

      if (reset) {
        setAddGroupResults(groups);
        setPage(2);
      } else {
        setAddGroupResults(prev => [...prev, ...groups]);
        setPage(currentPage + 1);
      }
      setHasMoreGroups(result.pagination?.hasMore ?? groups.length === 10);
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Error', 'Failed to load groups');
      setAddGroupResults([]);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleGroupDetails = (groupId) => {
    router.push({
      pathname: '/screens/GroupDetails',
      params: { groupId: groupId }
    });
  };

  const handleLoadMore = () => {
    if (!isLoadingGroups && hasMoreGroups && addGroupSearch.trim()) {
      handleSearchGroups();
    }
  };

  // Event Members handler
  const handleToggleEventMembers = () => {
    if (eventMembersHasMore) {
      setEventMembersPage(p => p + 1);
      setEventMembersDisplayCount(c => c + PAGE_SIZE);
    } else if (isEventMembersExpanded) {
      setEventMembersPage(1);
      setEventMembersDisplayCount(PAGE_SIZE);
      setEventMembers([]);
    }
  };

  const handleShowMemberDetails = async (member) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const resp = await fetch(
        `${apiUrl}/api/EventParticipants/events/${eventId}/player/${member.userId}`,
        { headers }
      );
      if (!resp.ok) throw new Error(`Failed to fetch member details: ${resp.status}`);
      const { success, user } = await resp.json();
      if (!success) throw new Error('Failed to load member details');

      let cityName = 'Unknown';
      if (user.cityId) {
        const cityResp = await fetch(
          `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${user.cityId}}`
        );
        const cityData = await cityResp.json();
        if (cityData.success && cityData.result.records.length) {
          cityName = cityData.result.records[0]['city_name_en'];
        }
      }

      setSelectedUser({
        fullName: user.fullName,
        profileImage: `${apiUrl}/Images/${user.profileImage || 'default_profile.png'}`,
        email: user.email || 'N/A',
        cityName,
        bio: user.bio || 'N/A',
        gender: user.gender === 'F' ? 'Female' : user.gender === 'M' ? 'Male' : 'Unknown',
      });
      setUserModalVisible(true);
    } catch (e) {
      console.error('Failed to fetch member details:', e);
      Alert.alert('Error', `Failed to load member details: ${e.message}`);
    }
  };

  // Join Requests handlers
  const handleToggleJoinRequests = () => {
    if (joinRequestsHasMore) {
      fetchJoinRequests(joinRequestsPage + 1);
    } else if (isJoinRequestsExpanded) {
      fetchJoinRequests(1);
    }
  };

  const handleShowRequestUserDetails = async (req) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const resp = await fetch(
        `${apiUrl}/api/EventParticipants/events/${eventId}/pending-request-user/${req.userId}`,
        { headers }
      );
      if (!resp.ok) throw new Error(`Failed to fetch user details: ${resp.status}`);
      const { success, user } = await resp.json();
      if (!success) throw new Error('Failed to load user details');

      let cityName = 'Unknown';
      if (user.cityId) {
        const cityResp = await fetch(
          `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${user.cityId}}`
        );
        const cityData = await cityResp.json();
        if (cityData.success && cityData.result.records.length) {
          cityName = cityData.result.records[0]['city_name_en'];
        }
      }

      setSelectedUser({
        fullName: user.fullName,
        profileImage: `${apiUrl}/Images/${user.profileImage || 'default_profile.png'}`,
        email: user.email || 'N/A',
        cityName,
        bio: user.bio || 'N/A',
        gender: user.gender === 'F' ? 'Female' : user.gender === 'M' ? 'Male' : 'Unknown',
      });
      setUserModalVisible(true);
    } catch (e) {
      console.error('Failed to fetch user details:', e);
      Alert.alert('Error', `Failed to load user details: ${e.message}`);
    }
  };

  const handleAcceptRequest = async (req) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const resp = await fetch(
        `${apiUrl}/api/EventParticipants/events/${eventId}/process-request/${req.userId}/true`,
        {
          method: 'POST',
          headers,
        }
      );
      if (!resp.ok) throw new Error(`Failed to accept request: ${resp.status}`);
      const result = await resp.json();
      if (!result.success) throw new Error(result.message || 'Failed to accept request');

      await fetchJoinRequests(1); // Refresh join requests
      setEvent(prev => ({
        ...prev,
        isParticipant: true,
        participantsNum: (prev.participantsNum || 0) + 1,
      }));
      setIsPlayerRequestPending(false);
      await AsyncStorage.setItem(
        `event_${eventId}`,
        JSON.stringify({
          isParticipant: true,
          isPlayerRequestPending: false,
          isSpectator,
        })
      );
      Alert.alert('Accepted', `${req.fullName}'s request has been accepted.`);
    } catch (e) {
      console.error('Failed to accept request:', e);
      Alert.alert('Error', `Failed to accept request: ${e.message}`);
    }
  };


  const handleRejectRequest = (req) => {
    setJoinRequests(requests => requests.filter(r => r.requestId !== req.requestId));
    setIsPlayerRequestPending(false);
    // Persist the state
    AsyncStorage.setItem(
      `event_${eventId}`,
      JSON.stringify({
        isParticipant: event.isParticipant,
        isPlayerRequestPending: false,
        isSpectator,
      })
    );
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

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
  if (error) return (
    <View className="flex-1 justify-center items-center p-4 bg-white">
      <Text className="text-red-500 mb-4">{error}</Text>
    </View>
  );

  // Destructure flags
  const { requiresTeams, isGroupParticipant, isParticipant, isAdmin } = event || {};

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
          source={{ uri: `${apiUrl}/Images/${event.eventImage || 'default_event.png'}` }}
          className="w-12 h-12 rounded-full"
        />
      </View>

      <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Details</Text>
        <Text className="text-base text-gray-700 mb-4">{event.description}</Text>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">Sport</Text>
          <Text className="text-base text-gray-900">{sportsMap[event.sportId] || 'Unknown'}</Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">City</Text>
          <Text className="text-base text-gray-900">{event.cityName || 'Unknown'}</Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">Start Date</Text>
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
          <Text className="text-base text-gray-900">{event.participantsNum || 'N/A'}</Text>
        </View>

        {requiresTeams ? (
          <>
            <View className="flex-row justify-between mb-2">
              <Text className="text-base text-gray-900 font-medium">Max Teams</Text>
              <Text className="text-base text-gray-900">{event.maxTeams || 'N/A'}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-base text-gray-900 font-medium">Teams Number</Text>
              <Text className="text-base text-gray-900">{event.teamsNum || 0}</Text>
            </View>
          </>
        ) : (
          <View className="flex-row justify-between mb-2">
            <Text className="text-base text-gray-900 font-medium">Max Participants</Text>
            <Text className="text-base text-gray-900">{event.maxParticipants || 'N/A'}</Text>
          </View>
        )}

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">Min Age</Text>
          <Text className="text-base text-gray-900">{event.minAge || 'N/A'}</Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-base text-gray-900 font-medium">Gender</Text>
          <Text className="text-base text-gray-900">{event.gender || 'N/A'}</Text>
        </View>

        {winnerName && (
          <View className="flex-row justify-between mb-2">
            <Text className="text-base text-gray-900 font-medium">Winner</Text>
            <Text className="text-base text-gray-900">{winnerName}</Text>
          </View>
        )}

        <View className="items-center mb-4">
          <TouchableOpacity
            onPress={handleLocationPress}
            className="flex-row items-center"
          >
            <Ionicons name="location" size={24} color="red" />
            <Text className="text-base text-gray-900 ml-2">
              {event.locationName || 'Unknown'}
            </Text>
          </TouchableOpacity>
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

          {requiresTeams ? (
            <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-800 mb-2">Event Groups</Text>
              <Text className="text-gray-600">Groups not implemented yet.</Text>
            </View>
          ) : (
            <>
              <View className="bg-white p-4 rounded-xl shadow mb-4 border border-gray-200">
                <Text className="text-lg font-semibold text-gray-800 mb-2">Event Members</Text>
                {eventMembers.length === 0 ? (
                  <Text className="text-gray-600">There are no participants in this event.</Text>
                ) : (
                  eventMembers.slice(0, eventMembersDisplayCount).map((m) => (
                    <View key={m.userId} className="flex-row justify-between items-center py-3 border-b border-gray-200">
                      <View className="flex-row items-center space-x-3">
                        <View className="w-12 h-12 rounded-full bg-green-300 justify-center items-center">
                          <Image
                            source={{ uri: m.participantImage }}
                            className="w-10 h-10 rounded-full"
                          />
                        </View>
                        <View>
                          <Text className="text-gray-800 text-base font-medium">{m.participantName}</Text>
                          <Text className="text-gray-500 text-sm">
                            Joined on {new Date(m.joinDate).toLocaleDateString('en-CA')}
                          </Text>
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

              <View className="bg-white p-4 rounded-xl shadow mb-4 border border-gray-200">
                <Text className="text-lg font-semibold text-gray-800 mb-2">Join Requests</Text>
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
            </>
          )}

          {requiresTeams && (
            <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
              <Text className="text-lg font-bold mb-2">Add Group</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-2 mb-2"
                placeholder="Search groups..."
                value={addGroupSearch}
                onChangeText={(text) => {
                  setAddGroupSearch(text);
                  if (text.trim()) {
                    handleSearchGroups(true);
                  } else {
                    setAddGroupResults([]);
                    setPage(1);
                    setHasMoreGroups(true);
                  }
                }}
              />
              <FlatList
                data={addGroupResults || []}
                keyExtractor={(item, index) =>
                  item.id ? item.id.toString() : `fallback-${index}`
                }
                renderItem={({ item }) => (
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: item.groupImage || 'https://via.placeholder.com/150' }}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      <Text className="text-base text-gray-700">{item.name}</Text>
                    </View>
                    <View className="flex-row">
                      <TouchableOpacity
                        onPress={() => handleGroupDetails(item.id)}
                        className="bg-gray-500 py-1 px-3 rounded-lg mr-2"
                      >
                        <Text className="text-white">Details</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleAddGroup(item)}
                        className="bg-blue-500 py-1 px-3 rounded-lg"
                      >
                        <Text className="text-white">Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.1}
                ListFooterComponent={isLoadingGroups ? (
                  <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 10 }} />
                ) : null}
              />
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

        <Modal visible={userModalVisible} animationType="slide" transparent>
          <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
            <View className="bg-white w-11/12 p-6 rounded-2xl shadow-lg">
              {selectedUser && (
                <>
                  <View className="flex-row items-center mb-4 space-x-4">
                    <Image
                      source={{ uri: selectedUser.profileImage || 'https://via.placeholder.com/150' }}
                      className="w-12 h-12 rounded-full"
                    />
                    <Text className="text-2xl font-bold text-gray-800">{selectedUser.fullName}</Text>
                  </View>
                  <View className="space-y-2">
                    <Text className="text-gray-700"><Text className="font-semibold">Email:</Text> {selectedUser.email}</Text>
                    <Text className="text-gray-700"><Text className="font-semibold">City:</Text> {selectedUser.cityName}</Text>
                    <Text className="text-gray-700"><Text className="font-semibold">Bio:</Text> {selectedUser.bio}</Text>
                    <Text className="text-gray-700"><Text className="font-semibold">Gender:</Text> {selectedUser.gender}</Text>
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
  if (isLoggedIn && !isAdmin) {
    return (
      <ScrollView className="p-4 bg-gray-100">
        {renderDetails()}

        {!requiresTeams ? (
          <>
            {isParticipant ? (
              <>
                {/* Case 1: Accepted as player */}
                <TouchableOpacity
                  onPress={handleLeaveEvent}
                  className="bg-red-500 py-3 rounded-lg mb-2"
                >
                  <Text className="text-white text-center font-bold">Leave Event</Text>
                </TouchableOpacity>
              </>
            ) : isPlayerRequestPending && !isSpectator ? (
              <>
                {/* Case 2: Player request pending, not spectator */}
                <TouchableOpacity
                  onPress={handleCancelPlayer}
                  className="bg-red-500 py-3 rounded-lg mb-2"
                >
                  <Text className="text-white text-center font-bold">Cancel Request</Text>
                </TouchableOpacity>
              </>
            ) : (isPlayerRequestPending || isSpectator) ? (
              <>
                {/* Case 3: Player request pending or is spectator */}
                <TouchableOpacity
                  disabled={true}
                  className="bg-gray-500 py-3 rounded-lg mb-2 opacity-50"
                >
                  <Text className="text-white text-center font-bold">Cant Request to Join as Player</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Case 4: No participation or pending request */}
                <TouchableOpacity
                  onPress={handleRequestPlayer}
                  className="bg-green-500 py-3 rounded-lg mb-2"
                >
                  <Text className="text-white text-center font-bold">Request to Join as Player</Text>
                </TouchableOpacity>
              </>
            )}
            {/* Spectator button */}
            {isSpectator ? (
              <TouchableOpacity
                onPress={handleLeaveEvent}
                className="bg-red-500 py-3 rounded-lg mb-4"
              >
                <Text className="text-white text-center font-bold">Leave Event</Text>
              </TouchableOpacity>
            ) : isPlayerRequestPending ? (
              <TouchableOpacity
                disabled={true}
                className="bg-gray-500 py-3 rounded-lg mb-4 opacity-50"
              >
                <Text className="text-white text-center font-bold">Cant Join as Spectator</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleJoinSpectator}
                className="bg-green-500 py-3 rounded-lg mb-4"
              >
                <Text className="text-white text-center font-bold">Join as Spectator</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          // Team-based event logic
          isGroupParticipant ? (
            <TouchableOpacity
              onPress={handleAddToCalendar}
              className="bg-green-500 py-3 rounded-lg mb-4"
            >
              <Text className="text-white text-center font-bold">You are signed — Add to Calendar</Text>
            </TouchableOpacity>
          ) : isParticipant && !isSpectator ? (
            <TouchableOpacity
              onPress={handleLeaveEvent}
              className="bg-red-500 py-3 rounded-lg mb-4"
            >
              <Text className="text-white text-center font-bold">Leave Event</Text>
            </TouchableOpacity>
          )
            : (
              <TouchableOpacity
                onPress={handleJoinSpectator}
                className="bg-green-500 py-3 rounded-lg mb-4"
              >
                <Text className="text-white text-center font-bold">Join as Spectator</Text>
              </TouchableOpacity>
            )
        )}
      </ScrollView>
    );
  }
}
