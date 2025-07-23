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
  isEmailVerified
}) {
  const [loading, setLoading] = useState(false);

  if (!event || !isLoggedIn) return null;
  if (event.isAdmin) return null;

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
          <TouchableOpacity
            className={`py-3 rounded-lg mb-2 ${
              isEmailVerified ? "bg-[#65DA84]" : "bg-gray-400"
            }`}
            onPress={() => isEmailVerified && handleAction(onJoinAsSpectator)}
            disabled={loading || !isEmailVerified}
          >
            <Text className="text-white text-center font-bold">
              {loading
                ? "Processing..."
                : isEmailVerified
                ? "Join as Spectator"
                : "Verify your email to join group as spectator"}
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

  // Non-team events (requiresTeams: false)
  return (
    <View className="my-4">
      {event.isParticipant ? (
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
        <>
          <TouchableOpacity
            className={`py-3 rounded-lg mb-2 ${
              isEmailVerified ? "bg-[#65DA84]" : "bg-gray-400"
            }`}
            onPress={() => isEmailVerified && handleAction(onJoinAsPlayer)}
            disabled={loading || !isEmailVerified}
          >
            <Text className="text-white text-center font-bold">
              {loading
                ? "Processing..."
                : isEmailVerified
                ? "Request to Join as Player"
                : "Verify your email to join group as player"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`py-3 rounded-lg mb-2 ${
              isEmailVerified ? "bg-[#65DA84]" : "bg-gray-400"
            }`}
            onPress={() => isEmailVerified && handleAction(onJoinAsSpectator)}
            disabled={loading || !isEmailVerified}
          >
            <Text className="text-white text-center font-bold">
              {loading
                ? "Processing..."
                : isEmailVerified
                ? "Join as Spectator"
                : "Verify your email to join group as spectator"}
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
