// screens/EventDetails.jsx
import React, { useState } from "react";
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, Text } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from "expo-router";

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

	
const EditEventCard = ({ onEdit }) => (
  <View className="bg-white p-4 rounded-xl shadow mb-6">
    <TextInput
      className="border border-gray-300 rounded-lg p-3 mb-3"
      placeholder="Type event note (optional)..."
      placeholderTextColor="#9CA3AF"
      value=""
      editable={false} // Disabled input as a placeholder to match style
      multiline
    />
    <View className="flex-row space-x-3">
      <TouchableOpacity
        className="flex-1 py-3 rounded-full bg-gray-300"
        disabled={true} // Disable placeholder button
      >
        <Text className="text-white text-center font-bold">Send Note</Text>
      </TouchableOpacity>
      <TouchableOpacity className="flex-1 py-3 rounded-full bg-blue-500" onPress={onEdit}>
        <Text className="text-white text-center font-bold">Edit Event</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function EventDetails() {
  const { eventId } = useLocalSearchParams();

  // State for modals
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
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
    refreshMembers // Pass callback to refresh members when a request is approved
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

        <ScrollView
          className="flex-1 p-4"
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
            />
          )}
   
          {/* Edit Event button for admins */}
          {isLoggedIn && isAdmin && (
           <EditEventCard onEdit={() => setEditModalVisible(true)} />
          )}
        </ScrollView>
	
        {/* Edit Event Modal */}
        <EditEventModal
          visible={editModalVisible}
          event={event}
          onClose={() => setEditModalVisible(false)}
          onSave={() => {
            onRefresh(); // Refresh event data after save
            setEditModalVisible(false);
          }}
          token={token} // Pass token for API calls
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
