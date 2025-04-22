// components/event/EventActions.jsx
import React, { useState } from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";

export default function EventActions({
  event,
  isLoggedIn,
  onJoinAsSpectator,
  onJoinAsPlayer,
  onCancelRequest,
  onLeaveEvent,
  onCancelSpectating,
}) {
  const [loading, setLoading] = useState(false);

  // Don't show anything if event data isn't loaded yet or user isn't logged in
  if (!event || !isLoggedIn) return null;

  // Don't show buttons for admins
  if (event.isAdmin) return null;

  // Helper function to handle loading state during async operations
  const handleAction = async (action) => {
    setLoading(true);
    await action();
    setLoading(false);
  };

  // Team events (requiresTeams: true)
  if (event.requiresTeams) {
    return (
      <View className="my-4">
        {event.isParticipant ? (
          // Only show cancel button if user is a spectator (playWatch = false)
          // If playWatch is true, they are a player and shouldn't see the cancel button
          !event.playWatch ? (
            <TouchableOpacity
              className="bg-red-500 py-3 rounded-lg mb-2"
              onPress={() => handleAction(onCancelSpectating)}
              disabled={loading}
            >
              <Text className="text-white text-center font-bold">
                {loading ? "Processing..." : "Cancel Spectating"}
              </Text>
            </TouchableOpacity>
          ) : null
        ) : (
          // User is not spectating - show join button
          <TouchableOpacity
            className="bg-[#65DA84] py-3 rounded-lg mb-2"
            onPress={() => handleAction(onJoinAsSpectator)}
            disabled={loading}
          >
            <Text className="text-white text-center font-bold">
              {loading ? "Processing..." : "Join as Spectator"}
            </Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View className="absolute inset-0 justify-center items-center bg-black bg-opacity-10 rounded-lg">
            <ActivityIndicator color="#65DA84" />
          </View>
        )}
      </View>
    );
  }

  // Participant events (requiresTeams: false)
  return (
    <View className="my-4">
      {event.isParticipant ? (
        // User is a participant - show leave button
        <TouchableOpacity
          className="bg-red-500 py-3 rounded-lg mb-2"
          onPress={() => handleAction(onLeaveEvent)}
          disabled={loading}
        >
          <Text className="text-white text-center font-bold">
            {loading ? "Processing..." : "Leave Event"}
          </Text>
        </TouchableOpacity>
      ) : event.hasPendingRequest ? (
        // User has a pending request - show cancel request button
        <TouchableOpacity
          className="bg-red-500 py-3 rounded-lg mb-2"
          onPress={() => handleAction(onCancelRequest)}
          disabled={loading}
        >
          <Text className="text-white text-center font-bold">
            {loading ? "Processing..." : "Cancel Join Request"}
          </Text>
        </TouchableOpacity>
      ) : (
        // Regular user - show both join buttons
        <>
          <TouchableOpacity
            className="bg-[#65DA84] py-3 rounded-lg mb-2"
            onPress={() => handleAction(onJoinAsPlayer)}
            disabled={loading}
          >
            <Text className="text-white text-center font-bold">
              {loading ? "Processing..." : "Request to Join as Player"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#65DA84] py-3 rounded-lg mb-2"
            onPress={() => handleAction(onJoinAsSpectator)}
            disabled={loading}
          >
            <Text className="text-white text-center font-bold">
              {loading ? "Processing..." : "Join as Spectator"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {loading && (
        <View className="absolute inset-0 justify-center items-center bg-black bg-opacity-10 rounded-lg">
          <ActivityIndicator color="#65DA84" />
        </View>
      )}
    </View>
  );
}
