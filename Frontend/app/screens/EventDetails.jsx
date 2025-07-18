import React, { useState, useEffect, useRef } from "react";
import { View, KeyboardAvoidingView, Keyboard, Platform, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert, Text } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Import our hooks
import useAuth from "../hooks/useAuth";
import useSports from "../hooks/useSports";
import useEventDetails from "../hooks/useEventDetails";
import useEventMembers from "../hooks/useEventMembers";
import useEventRequests from "../hooks/useEventRequests";
import useEventGroups from "../hooks/useEventGroups";

// Import components
import LoadingIndicator from "../components/common/LoadingIndicator";
import ErrorState from "../components/common/ErrorState";
import EventHeader from "../components/event/EventHeader";
import EventDetailsCard from "../components/event/EventDetailsCard";
import EventActions from "../components/event/EventActions";
import EventMembers from "../components/event/EventMembers";
import PendingRequests from "../components/event/PendingRequests";
import EventGroups from "../components/event/EventGroups";
import GroupSearch from "../components/event/GroupSearch";
import EditEventModal from "../components/event/EditEventModal";
import UserDetailsModal from "../components/modals/UserDetailsModal";
import AlertNotification from "../components/common/AlertNotification";
import AddToCalendarButton from '../components/event/AddToCalendarButton';
import AdminNotificationModal from '../components/AdminNotificationModal';

const EditEventCard = ({ onEdit, onNotification }) => (
  <View className="bg-white p-4 rounded-xl shadow mb-6">
    <TouchableOpacity
      className="bg-blue-500 rounded-lg p-4 mb-4"
      onPress={onNotification}
    >
      <View className="flex-row items-center justify-center">
        <Ionicons name="megaphone" size={20} color="#fff" />
        <Text className="text-white text-center font-bold ml-2">Send Notification to Event</Text>
      </View>
    </TouchableOpacity>
    <TouchableOpacity
      className="bg-green-300 rounded-lg p-4 mb-4"
      onPress={onEdit}
    >
      <Text className="text-gray-800 text-center font-bold">Edit Event</Text>
    </TouchableOpacity>
  </View>
);

export default function EventDetails() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();

  // State for modals
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Refs for scrolling
  const scrollViewRef = useRef(null);
  const groupSearchInputRef = useRef(null);

  // Use our existing hooks
  const { token } = useAuth();
  const isLoggedIn = !!token;
  const { sportsMap } = useSports(token);

  // Use our updated hook for event details
  const {
    event,
    loading,
    error,
    refreshing,
    onRefresh,
    handleLocationPress,
    joinAsSpectator,
    joinAsPlayer,
    cancelRequest,
    leaveEvent,
    cancelSpectating,
    alert,
    hideAlert,
    citiesMap,
    setCitiesMap,
  } = useEventDetails(eventId, token);

  // Only initialize these hooks if event data is loaded
  const isAdmin = event?.isAdmin;
  const isTeamEvent = event?.requiresTeams;
  const isParticipantEvent = event && !event.requiresTeams;
  const isParticipant = event?.isParticipant;

  // Use member management hook for admin of participant events
  const {
    members,
    loading: membersLoading,
    hasMore: membersHasMore,
    expanded: membersExpanded,
    toggleExpand: toggleMembers,
    getMemberDetails,
    removeMember,
    refreshMembers,
  } = useEventMembers(
    eventId,
    token,
    isAdmin && isParticipantEvent,
    citiesMap,
    setCitiesMap
  );

  // Use join requests management hook for admin of participant events
  const {
    requests,
    loading: requestsLoading,
    hasMore: requestsHasMore,
    expanded: requestsExpanded,
    toggleExpand: toggleRequests,
    getUserDetails,
    approveRequest,
    rejectRequest,
  } = useEventRequests(
    eventId,
    token,
    isAdmin && isParticipantEvent,
    citiesMap,
    setCitiesMap,
    refreshMembers
  );

  // Use groups management hook for team events
  const {
    groups,
    loading: groupsLoading,
    hasMore: groupsHasMore,
    expanded: groupsExpanded,
    toggleExpand: toggleGroups,
    removeGroup,
    refreshGroups,
  } = useEventGroups(eventId, token, isTeamEvent);

  // Handler functions
  const handleViewMemberDetails = async (userId) => {
    const user = await getMemberDetails(userId);
    if (user) {
      setSelectedUser(user);
      setUserModalVisible(true);
    }
  };

  const handleViewRequestDetails = async (userId) => {
    const user = await getUserDetails(userId);
    if (user) {
      setSelectedUser(user);
      setUserModalVisible(true);
    }
  };

  const handleRemoveMember = (userId) => {
    Alert.alert(
      "Remove Member",
      "Are you sure you want to remove this member?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeMember(userId),
        },
      ]
    );
  };

  const handleRemoveGroup = (groupId, groupName) => {
    Alert.alert(
      "Remove Group",
      `Are you sure you want to remove "${groupName}" from this event?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeGroup(groupId, groupName),
        },
      ]
    );
  };

  // Handle TextInput focus to scroll to its position
  const handleInputFocus = () => {
    if (groupSearchInputRef.current && scrollViewRef.current) {
      groupSearchInputRef.current.measureInWindow((x, y, width, height) => {
        scrollViewRef.current.scrollTo({ y: y - 20, animated: true }); // Minimal offset for tight scrolling
      });
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Show loading indicator when initially loading
  if (loading && !refreshing) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const isLoading =
    refreshing || membersLoading || requestsLoading || groupsLoading;

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 bg-gray-100">
        <AlertNotification
          visible={alert.visible}
          message={alert.message}
          type={alert.type}
          onHide={hideAlert}
        />

        <UserDetailsModal
          visible={userModalVisible}
          user={selectedUser}
          onClose={() => setUserModalVisible(false)}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
        >
          <ScrollView
            className="p-4"
            contentContainerStyle={{
              paddingBottom: keyboardVisible ? 20 : 0 // Minimal padding to eliminate gap
            }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustContentInsets={false}
            ref={scrollViewRef}
            onContentSizeChange={() => {
              if (keyboardVisible && !groupSearchInputRef.current) {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            }}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={onRefresh}
                colors={["#65DA84"]}
                tintColor="#65DA84"
              />
            }
          >
            <EventHeader event={event} />
            <View className="h-px bg-green-400 mb-4" />

            <EventDetailsCard
              event={event}
              sportsMap={sportsMap}
              handleLocationPress={handleLocationPress}
            />

            {/* Event Actions - Join/Leave buttons */}
            {event && (
              <EventActions
                event={event}
                isLoggedIn={isLoggedIn}
                onJoinAsSpectator={joinAsSpectator}
                onJoinAsPlayer={joinAsPlayer}
                onCancelRequest={cancelRequest}
                onLeaveEvent={leaveEvent}
                onCancelSpectating={cancelSpectating}
              />
            )}

            {/* Add to Calendar button, rendered only after event details are loaded */}
            {(isParticipant || isAdmin) && (
              <AddToCalendarButton event={event} />
            )}

            {(isParticipant || isAdmin) && (
              <TouchableOpacity
                className="border border-green-600 rounded-lg p-4 mb-4 bg-transparent flex-row items-center justify-center"
                onPress={() =>
                  router.push({
                    pathname: "./Certificate",
                    params: { event: JSON.stringify(event) },
                  })
                }
              >
                <Ionicons name="document-text-outline" size={20} color="black" style={{ marginRight: 8 }} />
                <Text className="text-black text-center font-bold">Show Certificate</Text>
              </TouchableOpacity>
            )}

            {/* Admin features for participant events */}
            {isAdmin && isParticipantEvent && (
              <>
                <EventMembers
                  members={members}
                  loading={membersLoading}
                  hasMore={membersHasMore}
                  expanded={membersExpanded}
                  onToggleExpand={toggleMembers}
                  onViewDetails={handleViewMemberDetails}
                  onRemoveMember={handleRemoveMember}
                />
                <View className="h-px bg-green-400 mb-4" />
                <PendingRequests
                  requests={requests}
                  loading={requestsLoading}
                  hasMore={requestsHasMore}
                  expanded={requestsExpanded}
                  onToggleExpand={toggleRequests}
                  onViewDetails={handleViewRequestDetails}
                  onApprove={approveRequest}
                  onReject={rejectRequest}
                />
              </>
            )}

            {/* Group features for team events */}
            {isTeamEvent && (
              <EventGroups
                groups={groups}
                loading={groupsLoading}
                hasMore={groupsHasMore}
                expanded={groupsExpanded}
                onToggleExpand={toggleGroups}
                onRemoveGroup={handleRemoveGroup}
                isAdmin={isAdmin}
                token={token}
              />
            )}
            <View className="h-px bg-green-400 mb-4" />

            {/* Group search for admins of team events */}
            {isAdmin && isTeamEvent && (
              <GroupSearch
                event={event}
                token={token}
                sportsMap={sportsMap}
                onAddGroup={refreshGroups}
                inputRef={groupSearchInputRef}
                onInputFocus={handleInputFocus}
              />
            )}

            {/* Edit Event button for admins */}
            {isLoggedIn && isAdmin && (
              <EditEventCard
                onEdit={() => setEditModalVisible(true)}
                onNotification={() => setNotificationModalVisible(true)}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
        {/* Edit Event Modal */}
        <EditEventModal
          visible={editModalVisible}
          event={event}
          onClose={() => setEditModalVisible(false)}
          onSave={() => {
            onRefresh();
            setEditModalVisible(false);
          }}
          token={token}
        />

        <AdminNotificationModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
          eventId={eventId}
          requiresTeams={event?.requiresTeams}
          isPublic={event?.isPublic}
        />
      </View>
    </SafeAreaView>
  );
}