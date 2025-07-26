// components/event/EventDetailsCard.jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventDetailsCard({ event, sportsMap, handleLocationPress }) {
  if (!event) return null;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <View className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
      <Text className="text-lg font-semibold text-gray-900 mb-2">Details</Text>
      <Text className="text-base text-gray-700 mb-4">{event.description}</Text>

      <View className="flex-row justify-between mb-2">
        <Text className="text-base text-gray-900 font-medium">Sport</Text>
        <Text className="text-base text-gray-900">{sportsMap[event.sportId] || `Sport ID: ${event.sportId}`}</Text>
      </View>

      <View className="flex-row justify-between mb-2">
        <Text className="text-base text-gray-900 font-medium">City</Text>
        <Text className="text-base text-gray-900">{event.cityName || 'Unknown'}</Text>
      </View>

      <View className="flex-row justify-between mb-2">
        <Text className="text-base text-gray-900 font-medium">Start Date</Text>
        <Text className="text-base text-gray-900">{formatDate(event.startDatetime)}</Text>
      </View>

      <View className="flex-row justify-between mb-2">
        <Text className="text-base text-gray-900 font-medium">End Date</Text>
        <Text className="text-base text-gray-900">{formatDate(event.endDatetime)}</Text>
      </View>

      {/* Show different fields based on event type */}
      {event.requiresTeams ? (
        <>
          <View className="flex-row justify-between mb-2">
            <Text className="text-base text-gray-900 font-medium">Teams Number</Text>
            <Text className="text-base text-gray-900">{event.teamsNum || 0}</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-base text-gray-900 font-medium">Max Teams</Text>
            <Text className="text-base text-gray-900">{event.maxTeams || 'N/A'}</Text>
          </View>
        </>
      ) : (
        <>
          <View className="flex-row justify-between mb-2">
            <Text className="text-base text-gray-900 font-medium">Members</Text>
            <Text className="text-base text-gray-900">{event.participantsNum || 0}</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-base text-gray-900 font-medium">Max Participants</Text>
            <Text className="text-base text-gray-900">{event.maxParticipants || 'N/A'}</Text>
          </View>
        </>
      )}

      <View className="flex-row justify-between mb-2">
        <Text className="text-base text-gray-900 font-medium">Min Age</Text>
        <Text className="text-base text-gray-900">{event.minAge || 'N/A'}</Text>
      </View>

      <View className="flex-row justify-between mb-2">
        <Text className="text-base text-gray-900 font-medium">Gender</Text>
        <Text className="text-base text-gray-900">{event.gender || 'Any'}</Text>
      </View>

      <View className="flex-row justify-between mb-2">
        <Text className="text-base text-gray-900 font-medium">Spectators</Text>
        <Text className="text-base text-gray-900">
          {event.viewerCount != null ? event.viewerCount : 'N/A'}
        </Text>
      </View>

      <View className="items-center mb-4 mt-4">
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
  );
}
